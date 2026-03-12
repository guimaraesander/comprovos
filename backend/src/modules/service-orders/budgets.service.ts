import { prisma } from "../../lib/prisma";
import { HttpError } from "../../utils/http-error";
import type { UpsertBudgetInput } from "./budgets.schemas";

export class BudgetsService {
  async getByServiceOrderId(serviceOrderId: string) {
    const budget = await prisma.serviceOrderBudget.findUnique({
      where: { serviceOrderId },
      include: { items: true },
    });

    if (!budget) throw HttpError.notFound("Orçamento não encontrado.");
    return budget;
  }

  /**
   * Garante que exista um orçamento “vazio” para a OS (1 por OS).
   * Útil quando a OS entra em AGUARDANDO_APROVACAO.
   */
  async ensureExists(serviceOrderId: string) {
    // valida OS
    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { id: true },
    });
    if (!order) throw HttpError.notFound("Ordem de serviço não encontrada.");

    await prisma.serviceOrderBudget.upsert({
      where: { serviceOrderId },
      create: {
        serviceOrderId,
        travelFee: 0,
        thirdPartyFee: 0,
        discount: 0,
      },
      update: {},
    });
  }

  /**
   * Cria/atualiza orçamento (upsert) + substitui itens de forma atômica.
   * Estratégia segura: upsert no header + deleteMany + createMany (transaction).
   */
  async upsert(serviceOrderId: string, input: UpsertBudgetInput) {
    // valida OS
    const order = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      select: { id: true, status: true },
    });
    if (!order) throw HttpError.notFound("Ordem de serviço não encontrada.");

    // Regra de negócio (ajuste se quiser permitir antes):
    // orçamento só faz sentido quando está em AGUARDANDO_APROVACAO (ou depois).
    const allowed = ["AGUARDANDO_APROVACAO", "EM_MANUTENCAO", "FINALIZADA", "ENTREGUE"] as const;
    if (!allowed.includes(order.status as any)) {
      throw HttpError.badRequest(
        "Orçamento só pode ser criado/editado quando a OS estiver em AGUARDANDO_APROVACAO (ou etapas seguintes)."
      );
    }

    const { items, ...header } = input;

    const result = await prisma.$transaction(async (tx) => {
      const budget = await tx.serviceOrderBudget.upsert({
        where: { serviceOrderId },
        create: {
          serviceOrderId,
          travelFee: header.travelFee ?? 0,
          thirdPartyFee: header.thirdPartyFee ?? 0,
          discount: header.discount ?? 0,
          note: header.note ?? null,
        },
        update: {
          travelFee: header.travelFee ?? 0,
          thirdPartyFee: header.thirdPartyFee ?? 0,
          discount: header.discount ?? 0,
          note: header.note ?? null,
        },
      });

      // substitui itens (evita “lixo” e mantém consistência)
      await tx.serviceOrderBudgetItem.deleteMany({
        where: { budgetId: budget.id },
      });

      if (items && items.length > 0) {
        await tx.serviceOrderBudgetItem.createMany({
          data: items.map((it) => ({
            budgetId: budget.id,
            description: it.description,
            technician: it.technician ?? null,
            qty: it.qty ?? 1,
            unitValue: it.unitValue,
          })),
        });
      }

      const hydrated = await tx.serviceOrderBudget.findUnique({
        where: { id: budget.id },
        include: { items: true, serviceOrder: true },
      });

      if (!hydrated) throw HttpError.internal("Falha ao carregar orçamento após salvar.");
      return hydrated;
    });

    return result;
  }
}