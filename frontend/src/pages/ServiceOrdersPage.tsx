import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { Card } from "../components/Card";
import { Table } from "../components/Table";
import { FormGrid, Field } from "../components/Form";
import { AlertError, Muted } from "../components/Alert";

import { listClients, type Client } from "../services/clients";
import {
  createServiceOrder,
  listServiceOrders,
  updateServiceOrder,
  updateServiceOrderStatus,
  upsertServiceOrderBudget,
  type ServiceOrder,
  type ServiceOrderStatus,
  type ServiceOrderBudget,
  type ServiceOrderBudgetItem,
  type UpsertBudgetInput,
  type PaymentType,
} from "../services/serviceOrders";

import styles from "./ServiceOrdersPage.module.css";

function safeErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Não foi possível conectar ao servidor.";
    return (err.response.data as any)?.message || "Não foi possível concluir a operação.";
  }
  if (err instanceof Error) return err.message;
  return "Não foi possível concluir a operação.";
}

function ModalError({ message }: { message: string }) {
  return (
    <AlertError role="alert" aria-live="polite" style={{ marginBottom: 12 }}>
      {message}
    </AlertError>
  );
}

const STATUS_LABEL: Record<ServiceOrderStatus, string> = {
  ABERTA: "ABERTA",
  EM_ANALISE: "EM ANÁLISE",
  AGUARDANDO_APROVACAO: "AGUARD. APROVAÇÃO",
  EM_MANUTENCAO: "EM MANUTENÇÃO",
  FINALIZADA: "FINALIZADA",
  PAGO: "PAGO",
  ENTREGUE: "ENTREGUE",
  CANCELADA: "CANCELADA",
};

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

const WARRANTY_TEXT = [
  "A garantia começa a contar a partir da retirada do equipamento ou 30 dias após o aviso de retirada, mesmo o equipamento permanecendo na loja.",
  "Todo equipamento sairá lacrado com nosso lacre de garantia; a remoção do mesmo implica em perda da garantia.",
  "A garantia não cobre danos causados pelo usuário, como quedas, trincos na tela, derramamento de líquido ou vírus.",
] as const;

const ENTRY_NOTES_TEXT = [
  "Prazo para orçamento em até 10 dias úteis.",
  "Equipamentos concluídos devem ser retirados após aviso da assistência.",
  "Acessórios só ficam sob responsabilidade da assistência quando registrados na OS.",
] as const;

const BUDGET_PAYMENT_CONDITIONS_TEXT =
  "Consulte condições de parcelamento no cartão e possíveis descontos para pagamento em PIX ou dinheiro.";

const BUDGET_VALIDITY_TEXT = "Orçamento válido por 10 dias.";

const PAYMENT_RECEIPT_DECLARATION_TEXT =
  "Declaro estar recebendo o equipamento e os materiais constantes nesta Ordem de Serviço devidamente reparados.";

const COMPANY_NAME = "ComprovOS Assistência Técnica";
const COMPANY_CONTACT = "Telefone / WhatsApp: (85) 98765-4321";
const COMPANY_ADDRESS = "Endereço da assistência: Rua Major Facundo, 1020, Sala 405 – Centro, Fortaleza - CE, CEP: 60025-100";

const STATUS_FLOW: ServiceOrderStatus[] = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "EM_MANUTENCAO",
  "FINALIZADA",
  "PAGO",
  "ENTREGUE",
  "CANCELADA",
];

type FormState = {
  clientId: string;
  clientCpfCnpj: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress: string;
  equipmentType: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentSerialNumber: string;
  equipmentPassword: string;
  symptoms: string;
  accessories: string;
  observations: string;
};

const initialForm: FormState = {
  clientId: "",
  clientCpfCnpj: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientAddress: "",
  equipmentType: "",
  equipmentBrand: "",
  equipmentModel: "",
  equipmentSerialNumber: "",
  equipmentPassword: "",
  symptoms: "",
  accessories: "",
  observations: "",
};

type PaymentForm = {
  paymentType: PaymentType | "";
  paymentDate: string;
  pickupDate: string;
};

const initialPaymentForm: PaymentForm = {
  paymentType: "",
  paymentDate: "",
  pickupDate: "",
};

type BudgetFormItem = {
  id: string;
  description: string;
  technician: string;
  qty: string;
  unitValue: string;
};

type BudgetForm = {
  travelFee: string;
  thirdPartyFee: string;
  discount: string;
  note: string;
  items: BudgetFormItem[];
};

const initialBudgetForm: BudgetForm = {
  travelFee: "0",
  thirdPartyFee: "0",
  discount: "0",
  note: "",
  items: [],
};

function normalizeText(v: string) {
  const t = v.trim();
  return t.length ? t : "";
}

function normalizeCpfCnpj(v: string) {
  return (v || "").replace(/\D/g, "");
}

function formatClientAddress(c: Client) {
  const parts = [
    (c as any).address,
    (c as any).district,
    (c as any).city,
    (c as any).state,
    (c as any).zipCode,
  ].filter((x) => typeof x === "string" && x.trim().length > 0);

  return parts.join(" • ");
}

function truncateOneLine(text: string, max = 70) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return { short: t, truncated: false };
  return { short: t.slice(0, max).trimEnd() + "…", truncated: true };
}

function statusBadgeStyle(status: ServiceOrderStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.2,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#f2f4f7",
    color: "#344054",
    whiteSpace: "nowrap",
  };

  if (status === "CANCELADA") return { ...base, background: "#fee4e2", color: "#b42318", borderColor: "#fecdca" };
  if (status === "ENTREGUE") return { ...base, background: "#d1fadf", color: "#067647", borderColor: "#a6f4c5" };
  if (status === "PAGO") return { ...base, background: "#ecfdf3", color: "#027a48", borderColor: "#abefc6" };
  if (status === "FINALIZADA") return { ...base, background: "#e0eaff", color: "#175cd3", borderColor: "#c7d7fe" };
  if (status === "EM_MANUTENCAO") return { ...base, background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" };
  if (status === "AGUARDANDO_APROVACAO") {
    return { ...base, background: "#fef0c7", color: "#7a2e0e", borderColor: "#fedf89" };
  }
  if (status === "EM_ANALISE") return { ...base, background: "#f0f9ff", color: "#026aa2", borderColor: "#b9e6fe" };

  return base;
}

function equipmentLabel(order: ServiceOrder) {
  const parts = [order.equipmentType, order.equipmentBrand, order.equipmentModel].filter(Boolean);
  return parts.join(" ") || "-";
}

function formatDateTimeBR(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function formatDateInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateOnlyBR(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function responsibleName(order: ServiceOrder | null | undefined) {
  return order?.createdByUser?.name?.trim() || "-";
}

function toMoneyNumber(v: number | string | null | undefined) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function calcBudgetItemsTotal(items: ServiceOrderBudgetItem[] | undefined) {
  const list = Array.isArray(items) ? items : [];
  return list.reduce((acc, it) => acc + Number(it.qty || 0) * toMoneyNumber(it.unitValue), 0);
}

function calcBudgetTotal(budget: ServiceOrderBudget | null | undefined) {
  if (!budget) return 0;

  const itemsTotal = calcBudgetItemsTotal(budget.items);
  const travel = toMoneyNumber(budget.travelFee);
  const third = toMoneyNumber(budget.thirdPartyFee);
  const discount = toMoneyNumber(budget.discount);

  return itemsTotal + travel + third - discount;
}

function buttonsMode(status: ServiceOrderStatus) {
  const allEnabled = status === "ABERTA" || status === "EM_ANALISE" || status === "AGUARDANDO_APROVACAO";
  const onlyView =
    status === "EM_MANUTENCAO" ||
    status === "FINALIZADA" ||
    status === "PAGO" ||
    status === "ENTREGUE" ||
    status === "CANCELADA";

  return { allEnabled, onlyView };
}

type ViewMode = "ENTRY" | "BUDGET" | "PAYMENT";

function getViewMode(status: ServiceOrderStatus): ViewMode {
  if (status === "PAGO" || status === "ENTREGUE") return "PAYMENT";
  if (status === "AGUARDANDO_APROVACAO" || status === "EM_MANUTENCAO" || status === "FINALIZADA") return "BUDGET";
  return "ENTRY";
}

function nextStatusesAllowed(current: ServiceOrderStatus): ServiceOrderStatus[] {
  if (current === "FINALIZADA" || current === "PAGO" || current === "CANCELADA" || current === "ENTREGUE") return [];

  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0) return [];

  const next = STATUS_FLOW[idx + 1];
  const out: ServiceOrderStatus[] = [];

  if (next && next !== "CANCELADA") out.push(next);
  if (current === "ABERTA" || current === "EM_ANALISE" || current === "AGUARDANDO_APROVACAO") {
    out.push("CANCELADA");
  }

  return out;
}

function parseMoneyInput(v: string) {
  const t = v.trim();
  if (!t) return 0;

  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function newLocalId() {
  return `tmp_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function buildPrintableHtml(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          * { box-sizing: border-box; }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #101828;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }

          .doc {
            max-width: 900px;
            margin: 0 auto;
            display: grid;
            gap: 18px;
          }

          .company-header {
            border: 1px solid #d0d5dd;
            border-radius: 12px;
            padding: 16px;
            display: grid;
            gap: 6px;
            background: #f8fafc;
          }

          .company-name {
            font-size: 24px;
            font-weight: 700;
          }

          .company-line {
            font-size: 13px;
            color: #344054;
          }

          .doc-header {
            border-bottom: 1px solid #d0d5dd;
            padding-bottom: 10px;
            display: grid;
            gap: 8px;
          }

          .doc-title {
            font-size: 22px;
            font-weight: 700;
          }

          .doc-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 14px;
          }

          .section {
            display: grid;
            gap: 8px;
          }

          .section-title {
            font-size: 16px;
            font-weight: 700;
          }

          .line {
            font-size: 14px;
            line-height: 1.5;
          }

          .muted {
            color: #475467;
          }

          .items {
            display: grid;
            gap: 8px;
          }

          .item {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eaecf0;
          }

          .item-title {
            font-weight: 700;
          }

          .item-meta {
            font-size: 12px;
            color: #667085;
          }

          .totals {
            display: grid;
            gap: 6px;
          }

          .total-line {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            font-size: 14px;
          }

          .total-line.final {
            font-size: 16px;
            font-weight: 700;
            border-top: 1px solid #d0d5dd;
            padding-top: 8px;
            margin-top: 6px;
          }

          ul.notes {
            margin: 0;
            padding-left: 18px;
            display: grid;
            gap: 6px;
          }

          .signatures {
            margin-top: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            padding-top: 18px;
          }

          .signature-box {
            display: grid;
            gap: 10px;
            align-content: end;
          }

          .signature-line {
            border-top: 1px solid #101828;
            padding-top: 6px;
            font-size: 13px;
            text-align: center;
          }

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          @media print {
            .doc {
              max-width: none;
              gap: 10px;
              font-size: 11px;
            }

            .company-name {
              font-size: 22px;
            }

            .doc-title {
              font-size: 18px;
            }

            .doc-meta,
            .line,
            .item,
            .total-line,
            .signature-line,
            .notes li,
            .muted {
              font-size: 11px;
            }

            body {
              padding: 0;
            }

            .section {
              break-inside: avoid;
              page-break-inside: avoid;
              gap: 6px;
            }

            .item,
            .totals,
            .signatures,
            .signature-box,
            .notes li {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
}

function printableValue(value?: string | null) {
  return value && value.trim().length ? value : "-";
}

function renderItemsHtml(items: ServiceOrderBudgetItem[] | undefined) {
  if (!items?.length) {
    return `<div class="muted">Nenhum serviço registrado.</div>`;
  }

  return `
    <div class="items">
      ${items
        .map((it) => {
          const lineTotal = Number(it.qty || 0) * toMoneyNumber(it.unitValue);
          return `
            <div class="item">
              <div>
                <div class="item-title">${it.description}</div>
                <div class="item-meta">Técnico responsável: ${printableValue(it.technician)} • Qtd: ${it.qty}</div>
              </div>
              <div><strong>R$ ${lineTotal.toFixed(2)}</strong></div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function buildEntryDocumentHtml(selected: ServiceOrder) {
  return `
    <div class="doc">
      <div class="company-header">
        <div class="company-name">${COMPANY_NAME}</div>
        <div class="company-line">${COMPANY_CONTACT}</div>
        <div class="company-line">${COMPANY_ADDRESS}</div>
        <div class="company-line">Documento digital gerado pelo sistema ComprovOS.</div>
      </div>

      <div class="doc-header">
        <div class="doc-title">Comprovante de Entrada</div>
        <div class="doc-meta">
          <div><strong>Nº OS:</strong> ${selected.osNumber}</div>
          <div><strong>Data de entrada:</strong> ${formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
          <div><strong>Status:</strong> ${STATUS_LABEL[selected.status]}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Responsável pela OS</div>
        <div class="line"><strong>Nome:</strong> ${responsibleName(selected)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="line"><strong>Nome:</strong> ${printableValue(selected.client?.name)}</div>
        <div class="line"><strong>CPF/CNPJ:</strong> ${printableValue(selected.clientCpfCnpj)}</div>
        <div class="line"><strong>Telefone:</strong> ${printableValue(selected.client?.phone)}</div>
        <div class="line"><strong>Email:</strong> ${printableValue(selected.client?.email)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Equipamento</div>
        <div class="line"><strong>Equipamento:</strong> ${equipmentLabel(selected)}</div>
        <div class="line"><strong>Marca:</strong> ${printableValue(selected.equipmentBrand)}</div>
        <div class="line"><strong>Modelo:</strong> ${printableValue(selected.equipmentModel)}</div>
        <div class="line"><strong>Nº de série:</strong> ${printableValue(selected.equipmentSerialNumber)}</div>
        <div class="line"><strong>Senha:</strong> ${printableValue(selected.equipmentPassword)}</div>
      </div>

      <div class="section">
        <div class="section-title">Defeito / Reclamação</div>
        <div class="line">${printableValue(selected.symptoms)}</div>
      </div>

      <div class="section">
        <div class="section-title">Acessórios</div>
        <div class="line">${printableValue(selected.accessories)}</div>
      </div>

      <div class="section">
        <div class="section-title">Observações da OS</div>
        <div class="line">${printableValue(selected.observations)}</div>
      </div>

      <div class="section">
        <div class="section-title">Observações importantes</div>
        <ul class="notes">
          ${ENTRY_NOTES_TEXT.map((line) => `<li>${line}</li>`).join("")}
        </ul>
      </div>

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Assinatura do cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Responsável pela assistência</div>
        </div>
      </div>
    </div>
  `;
}

function buildBudgetDocumentHtml(selected: ServiceOrder) {
  return `
    <div class="doc">
      <div class="company-header">
        <div class="company-name">${COMPANY_NAME}</div>
        <div class="company-line">${COMPANY_CONTACT}</div>
        <div class="company-line">${COMPANY_ADDRESS}</div>
        <div class="company-line">Documento digital gerado pelo sistema ComprovOS.</div>
      </div>

      <div class="doc-header">
        <div class="doc-title">Orçamento da Ordem de Serviço</div>
        <div class="doc-meta">
          <div><strong>Nº OS:</strong> ${selected.osNumber}</div>
          <div><strong>Entrada:</strong> ${formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
          <div><strong>Status:</strong> ${STATUS_LABEL[selected.status]}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Responsável pela OS</div>
        <div class="line"><strong>Nome:</strong> ${responsibleName(selected)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="line"><strong>Nome:</strong> ${printableValue(selected.client?.name)}</div>
        <div class="line"><strong>CPF/CNPJ:</strong> ${printableValue(selected.clientCpfCnpj)}</div>
        <div class="line"><strong>Telefone:</strong> ${printableValue(selected.client?.phone)}</div>
        <div class="line"><strong>Email:</strong> ${printableValue(selected.client?.email)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Equipamento</div>
        <div class="line"><strong>Equipamento:</strong> ${equipmentLabel(selected)}</div>
        <div class="line"><strong>Marca:</strong> ${printableValue(selected.equipmentBrand)}</div>
        <div class="line"><strong>Modelo:</strong> ${printableValue(selected.equipmentModel)}</div>
        <div class="line"><strong>Nº de série:</strong> ${printableValue(selected.equipmentSerialNumber)}</div>
      </div>

      <div class="section">
        <div class="section-title">Defeito / Reclamação</div>
        <div class="line">${printableValue(selected.symptoms)}</div>
      </div>

      <div class="section">
        <div class="section-title">Serviços a executar</div>
        ${renderItemsHtml(selected.budget?.items)}
      </div>

      <div class="section">
        <div class="section-title">Totais do Orçamento</div>
        <div class="totals">
          <div class="total-line">
            <span>Subtotal (serviços)</span>
            <strong>R$ ${selected.budget ? calcBudgetItemsTotal(selected.budget.items).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Deslocamento</span>
            <strong>R$ ${selected.budget ? toMoneyNumber(selected.budget.travelFee).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Serviço de terceiros</span>
            <strong>R$ ${selected.budget ? toMoneyNumber(selected.budget.thirdPartyFee).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Desconto</span>
            <strong>- R$ ${selected.budget ? toMoneyNumber(selected.budget.discount).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line final">
            <span>Total</span>
            <span>${selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Condições de pagamento</div>
        <div class="line">${BUDGET_PAYMENT_CONDITIONS_TEXT}</div>
      </div>

      <div class="section">
        <div class="section-title">Validade</div>
        <div class="line">${BUDGET_VALIDITY_TEXT}</div>
      </div>

      ${
        selected.budget?.note
          ? `
      <div class="section">
        <div class="section-title">Observações do orçamento</div>
        <div class="line">${selected.budget.note}</div>
      </div>`
          : ""
      }

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Assinatura do cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Responsável pela assistência</div>
        </div>
      </div>
    </div>
  `;
}

function buildPaymentDocumentHtml(selected: ServiceOrder) {
  return `
    <div class="doc">
      <div class="company-header">
        <div class="company-name">${COMPANY_NAME}</div>
        <div class="company-line">${COMPANY_CONTACT}</div>
        <div class="company-line">${COMPANY_ADDRESS}</div>
        <div class="company-line">Documento digital gerado pelo sistema ComprovOS.</div>
      </div>

      <div class="doc-header">
        <div class="doc-title">Comprovante de Pagamento</div>
        <div class="doc-meta">
          <div><strong>Nº OS:</strong> ${selected.osNumber}</div>
          <div><strong>Data de entrada:</strong> ${formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
          <div><strong>Status:</strong> ${STATUS_LABEL[selected.status]}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Responsável pela OS</div>
        <div class="line"><strong>Nome:</strong> ${responsibleName(selected)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="line"><strong>Nome:</strong> ${printableValue(selected.client?.name)}</div>
        <div class="line"><strong>CPF/CNPJ:</strong> ${printableValue(selected.clientCpfCnpj)}</div>
        <div class="line"><strong>Telefone:</strong> ${printableValue(selected.client?.phone)}</div>
        <div class="line"><strong>Email:</strong> ${printableValue(selected.client?.email)}</div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Equipamento</div>
        <div class="line"><strong>Equipamento:</strong> ${equipmentLabel(selected)}</div>
        <div class="line"><strong>Marca:</strong> ${printableValue(selected.equipmentBrand)}</div>
        <div class="line"><strong>Modelo:</strong> ${printableValue(selected.equipmentModel)}</div>
        <div class="line"><strong>Nº de série:</strong> ${printableValue(selected.equipmentSerialNumber)}</div>
      </div>

      <div class="section">
        <div class="section-title">Serviços executados</div>
        ${renderItemsHtml(selected.budget?.items)}
      </div>

      <div class="section">
        <div class="section-title">Pagamento e retirada</div>
        <div class="line"><strong>Tipo de pagamento:</strong> ${selected.paymentType ? PAYMENT_TYPE_LABEL[selected.paymentType] : "-"}</div>
        <div class="line"><strong>Data do pagamento:</strong> ${formatDateOnlyBR(selected.paymentDate)}</div>
        <div class="line"><strong>Data da retirada:</strong> ${formatDateOnlyBR(selected.pickupDate)}</div>
      </div>

      <div class="section">
        <div class="section-title">Totais</div>
        <div class="totals">
          <div class="total-line">
            <span>Subtotal (serviços)</span>
            <strong>R$ ${selected.budget ? calcBudgetItemsTotal(selected.budget.items).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Deslocamento</span>
            <strong>R$ ${selected.budget ? toMoneyNumber(selected.budget.travelFee).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Serviço de terceiros</span>
            <strong>R$ ${selected.budget ? toMoneyNumber(selected.budget.thirdPartyFee).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line">
            <span>Desconto</span>
            <strong>- R$ ${selected.budget ? toMoneyNumber(selected.budget.discount).toFixed(2) : "0.00"}</strong>
          </div>
          <div class="total-line final">
            <span>Total</span>
            <span>${selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Garantia</div>
        <ul class="notes">
          ${WARRANTY_TEXT.map((line) => `<li>${line}</li>`).join("")}
        </ul>
      </div>

      <div class="section">
        <div class="section-title">Declaração de recebimento</div>
        <div class="line">${PAYMENT_RECEIPT_DECLARATION_TEXT}</div>
      </div>

      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">Assinatura do cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Responsável pela assistência</div>
        </div>
      </div>
    </div>
  `;
}

function printCurrentDocument(selected: ServiceOrder, viewMode: ViewMode) {
  const title =
    viewMode === "ENTRY"
      ? `Comprovante de Entrada - OS ${selected.osNumber}`
      : viewMode === "BUDGET"
      ? `Orçamento - OS ${selected.osNumber}`
      : `Comprovante de Pagamento - OS ${selected.osNumber}`;

  const body =
    viewMode === "ENTRY"
      ? buildEntryDocumentHtml(selected)
      : viewMode === "BUDGET"
      ? buildBudgetDocumentHtml(selected)
      : buildPaymentDocumentHtml(selected);

  const win = window.open("", "_blank", "width=900,height=700");

  if (!win) {
    window.alert("Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou pop-ups.");
    return;
  }

  win.document.open();
  win.document.write(buildPrintableHtml(title, body));
  win.document.close();

  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

export function ServiceOrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(initialBudgetForm);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(initialPaymentForm);
  const [modalSaving, setModalSaving] = useState(false);
  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [nextStatus, setNextStatus] = useState<ServiceOrderStatus>("EM_ANALISE");
  const [statusOptions, setStatusOptions] = useState<ServiceOrderStatus[]>([]);
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [statusModalError, setStatusModalError] = useState<string | null>(null);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);
  const [budgetModalError, setBudgetModalError] = useState<string | null>(null);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);
  const [pickupModalError, setPickupModalError] = useState<string | null>(null);
  const [cpfQuery, setCpfQuery] = useState("");
  const [cpfOpen, setCpfOpen] = useState(false);
  const cpfBoxRef = useRef<HTMLDivElement | null>(null);
  const createCpfInputRef = useRef<HTMLInputElement | null>(null);

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const sortedOrders = useMemo(() => {
    const list = Array.isArray(orders) ? [...orders] : [];
    list.sort((a, b) => (b.osNumber ?? 0) - (a.osNumber ?? 0));
    return list;
  }, [orders]);

  const cpfMatches = useMemo(() => {
    const q = normalizeCpfCnpj(cpfQuery);
    if (!q) return [];

    return clients
      .filter((c: any) => normalizeCpfCnpj(String(c.cpfCnpj || "")).startsWith(q))
      .slice(0, 8);
  }, [cpfQuery, clients]);

  function setBusy(id: string, value: boolean) {
    setBusyById((prev) => {
      const next = { ...prev };
      if (value) next[id] = true;
      else delete next[id];
      return next;
    });
  }

  async function loadAll() {
    setPageError(null);
    setLoading(true);

    try {
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setPageError(null);
    setRefreshing(true);

    try {
      const [ordersData, clientsData] = await Promise.all([listServiceOrders(), listClients()]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (err) {
      setPageError(safeErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const el = cpfBoxRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setCpfOpen(false);
    }

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setCpfQuery("");
    setCpfOpen(false);
    setCreateModalError(null);

    if (createCpfInputRef.current) {
      createCpfInputRef.current.setCustomValidity("");
    }

    setIsCreateOpen(true);
  }

  function closeAllModals() {
    if (modalSaving) return;

    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsStatusOpen(false);
    setIsDetailsOpen(false);
    setIsCancelOpen(false);
    setIsViewOpen(false);
    setIsBudgetOpen(false);
    setIsPaymentOpen(false);
    setIsPickupOpen(false);
    setCpfOpen(false);

    setCreateModalError(null);
    setEditModalError(null);
    setStatusModalError(null);
    setCancelModalError(null);
    setBudgetModalError(null);
    setPaymentModalError(null);
    setPickupModalError(null);
  }

  function applyClientSelection(c: Client) {
    const cpf = String((c as any).cpfCnpj || "");

    setForm((p) => ({
      ...p,
      clientId: c.id,
      clientCpfCnpj: cpf,
      clientName: c.name || "",
      clientPhone: String((c as any).phone || ""),
      clientEmail: String((c as any).email || ""),
      clientAddress: formatClientAddress(c),
    }));

    setCpfQuery(cpf);
    setCpfOpen(false);

    if (createCpfInputRef.current) {
      createCpfInputRef.current.setCustomValidity("");
    }
  }

  function clearClientSelection() {
    setForm((p) => ({
      ...p,
      clientId: "",
      clientCpfCnpj: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      clientAddress: "",
    }));

    if (createCpfInputRef.current) {
      createCpfInputRef.current.setCustomValidity("");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateModalError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);

    if (!clientId || !clientCpfCnpj) {
      if (createCpfInputRef.current) {
        createCpfInputRef.current.setCustomValidity("Selecione o cliente encontrado na lista.");
        createCpfInputRef.current.focus();
        createCpfInputRef.current.reportValidity();
      }

      return;
    }

    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    setModalSaving(true);

    try {
      const created = await createServiceOrder({
        clientId,
        clientCpfCnpj,
        equipmentType,
        equipmentBrand: normalizeText(form.equipmentBrand) || undefined,
        equipmentModel: normalizeText(form.equipmentModel) || undefined,
        equipmentSerialNumber: normalizeText(form.equipmentSerialNumber) || undefined,
        equipmentPassword: normalizeText(form.equipmentPassword) || undefined,
        symptoms,
        accessories: normalizeText(form.accessories) || undefined,
        observations: normalizeText(form.observations) || undefined,
      });

      setOrders((prev) => [created, ...prev]);
      closeAllModals();
    } catch (err) {
      setCreateModalError(safeErrorMessage(err));
    } finally {
      setModalSaving(false);
    }
  }

  function openEdit(order: ServiceOrder) {
    setSelected(order);
    setEditModalError(null);

    const c = order.client ?? clientsById.get(order.clientId) ?? null;

    setForm({
      clientId: order.clientId,
      clientCpfCnpj: order.clientCpfCnpj || "",
      clientName: c?.name || "",
      clientPhone: String((c as any)?.phone || ""),
      clientEmail: String((c as any)?.email || ""),
      clientAddress: c ? formatClientAddress(c as any) : "",
      equipmentType: order.equipmentType || "",
      equipmentBrand: order.equipmentBrand ?? "",
      equipmentModel: order.equipmentModel ?? "",
      equipmentSerialNumber: order.equipmentSerialNumber ?? "",
      equipmentPassword: order.equipmentPassword ?? "",
      symptoms: order.symptoms || "",
      accessories: order.accessories ?? "",
      observations: order.observations ?? "",
    });

    setCpfQuery(order.clientCpfCnpj || "");
    setCpfOpen(false);
    setIsEditOpen(true);
  }

  async function handleEdit() {
    if (!selected) return;

    setEditModalError(null);

    const clientId = normalizeText(form.clientId);
    const clientCpfCnpj = normalizeText(form.clientCpfCnpj);
    const equipmentType = normalizeText(form.equipmentType);
    const symptoms = normalizeText(form.symptoms);

    if (!clientId) return setEditModalError("Cliente inválido na OS.");
    if (!clientCpfCnpj) return setEditModalError("CPF/CNPJ inválido na OS.");
    if (!equipmentType) return setEditModalError("Informe o tipo do equipamento.");
    if (!symptoms) return setEditModalError("Informe os sintomas.");

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrder(selected.id, {
        clientId,
        clientCpfCnpj,
        equipmentType,
        equipmentBrand: normalizeText(form.equipmentBrand) || null,
        equipmentModel: normalizeText(form.equipmentModel) || null,
        equipmentSerialNumber: normalizeText(form.equipmentSerialNumber) || null,
        equipmentPassword: normalizeText(form.equipmentPassword) || null,
        symptoms,
        accessories: normalizeText(form.accessories) || null,
        observations: normalizeText(form.observations) || null,
      });

      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setEditModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openStatus(order: ServiceOrder) {
    setSelected(order);
    setStatusModalError(null);
    const opts = nextStatusesAllowed(order.status);
    setStatusOptions(opts);
    setNextStatus(opts[0] ?? order.status);
    setIsStatusOpen(true);
  }

  async function handleStatus() {
    if (!selected) return;

    setStatusModalError(null);
    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrderStatus(selected.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setStatusModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openDetails(order: ServiceOrder) {
    setSelected(order);
    setIsDetailsOpen(true);
  }

  function openView(order: ServiceOrder) {
    setSelected(order);
    setIsViewOpen(true);
  }

  function openCancel(order: ServiceOrder) {
    setSelected(order);
    setCancelModalError(null);
    setIsCancelOpen(true);
  }

  async function handleCancel() {
    if (!selected) return;

    setCancelModalError(null);
    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const updated = await updateServiceOrderStatus(selected.id, { status: "CANCELADA" });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      closeAllModals();
    } catch (err) {
      setCancelModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function openBudget(order: ServiceOrder) {
    setSelected(order);
    setBudgetModalError(null);

    const b = order.budget;

    setBudgetForm({
      travelFee: String(toMoneyNumber(b?.travelFee ?? 0)),
      thirdPartyFee: String(toMoneyNumber(b?.thirdPartyFee ?? 0)),
      discount: String(toMoneyNumber(b?.discount ?? 0)),
      note: b?.note ? String(b.note) : "",
      items: (b?.items || []).map((it) => ({
        id: it.id,
        description: it.description || "",
        technician: it.technician ? String(it.technician) : "",
        qty: String(it.qty ?? 1),
        unitValue: String(toMoneyNumber(it.unitValue)),
      })),
    });

    setIsBudgetOpen(true);
  }

  function openPayment(order: ServiceOrder) {
    setSelected(order);
    setPaymentModalError(null);
    setPaymentForm({
      paymentType: order.paymentType ?? "",
      paymentDate: formatDateInput(order.paymentDate),
      pickupDate: formatDateInput(order.pickupDate),
    });
    setIsPaymentOpen(true);
  }

  function openPickup(order: ServiceOrder) {
    setSelected(order);
    setPickupModalError(null);
    setPaymentForm({
      paymentType: order.paymentType ?? "",
      paymentDate: formatDateInput(order.paymentDate),
      pickupDate: formatDateInput(order.pickupDate),
    });
    setIsPickupOpen(true);
  }

  async function handleSavePayment() {
    if (!selected) return;

    setPaymentModalError(null);

    if (!paymentForm.paymentType) {
      return setPaymentModalError("Selecione o tipo de pagamento.");
    }

    if (!paymentForm.paymentDate) {
      return setPaymentModalError("Informe a data do pagamento.");
    }

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      await updateServiceOrder(selected.id, {
        paymentType: paymentForm.paymentType,
        paymentDate: paymentForm.paymentDate,
      });

      const finalOrder =
        selected.status === "FINALIZADA"
          ? await updateServiceOrderStatus(selected.id, { status: "PAGO" })
          : await updateServiceOrder(selected.id, {
              paymentType: paymentForm.paymentType,
              paymentDate: paymentForm.paymentDate,
            });

      setOrders((prev) => prev.map((o) => (o.id === finalOrder.id ? finalOrder : o)));
      closeAllModals();
    } catch (err) {
      setPaymentModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  async function handleSavePickup() {
    if (!selected) return;

    setPickupModalError(null);

    if (!paymentForm.pickupDate) {
      return setPickupModalError("Informe a data da retirada.");
    }

    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      await updateServiceOrder(selected.id, {
        pickupDate: paymentForm.pickupDate,
      });

      const finalOrder = await updateServiceOrderStatus(selected.id, { status: "ENTREGUE" });
      setOrders((prev) => prev.map((o) => (o.id === finalOrder.id ? finalOrder : o)));
      closeAllModals();
    } catch (err) {
      setPickupModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  function addBudgetItem() {
    setBudgetForm((p) => ({
      ...p,
      items: [...p.items, { id: newLocalId(), description: "", technician: "", qty: "1", unitValue: "0" }],
    }));
  }

  function removeBudgetItem(id: string) {
    setBudgetForm((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) }));
  }

  async function handleSaveBudget() {
    if (!selected) return;

    setBudgetModalError(null);
    setModalSaving(true);
    setBusy(selected.id, true);

    try {
      const payload: UpsertBudgetInput = {
        travelFee: parseMoneyInput(budgetForm.travelFee),
        thirdPartyFee: parseMoneyInput(budgetForm.thirdPartyFee),
        discount: parseMoneyInput(budgetForm.discount),
        note: normalizeText(budgetForm.note) || null,
        items: budgetForm.items
          .map((it) => ({
            description: normalizeText(it.description),
            technician: normalizeText(it.technician) || null,
            qty: Math.max(1, Number(it.qty || 1)),
            unitValue: parseMoneyInput(it.unitValue),
          }))
          .filter((it) => it.description.length > 0),
      };

      const saved = await upsertServiceOrderBudget(selected.id, payload);
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? ({ ...o, budget: saved } as ServiceOrder) : o)));
      closeAllModals();
    } catch (err) {
      setBudgetModalError(safeErrorMessage(err));
    } finally {
      setBusy(selected.id, false);
      setModalSaving(false);
    }
  }

  const viewMode: ViewMode = selected ? getViewMode(selected.status) : "ENTRY";

  return (
    <section className="content-body">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ordens de Serviço</h1>
          <p className="page-subtitle">Registro de entrada com dados do equipamento preenchidos na OS.</p>
        </div>
        <div className="page-actions">
          <Button type="button" variant="secondary" onClick={refresh} disabled={loading || refreshing}>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
          <Button type="button" variant="primary" onClick={openCreate} disabled={loading}>
            Nova OS
          </Button>
        </div>
      </div>

      {!loading ? (
        <div className="page-summary" aria-live="polite">
          <span className="page-stat-chip">{`Total: ${sortedOrders.length}`}</span>
        </div>
      ) : null}

      {pageError && <AlertError>{pageError}</AlertError>}

      {loading ? (
        <Muted>Carregando...</Muted>
      ) : (
        <Card>
          <Table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Status</th>
                <th>Cliente</th>
                <th>CPF/CNPJ</th>
                <th>Equipamento</th>
                <th>Sintomas</th>
                <th style={{ width: 420 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Muted>Nenhuma OS cadastrada ainda.</Muted>
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o) => {
                  const client = o.client ?? clientsById.get(o.clientId) ?? null;
                  const { short, truncated } = truncateOneLine(o.symptoms, 70);
                  const rowBusy = !!busyById[o.id];
                  const { allEnabled, onlyView } = buttonsMode(o.status);
                  const editIsBudget = o.status === "AGUARDANDO_APROVACAO";

                  return (
                    <tr key={o.id}>
                      <td>{o.osNumber}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openStatus(o)}
                          disabled={
                            rowBusy ||
                            o.status === "FINALIZADA" ||
                            o.status === "PAGO" ||
                            o.status === "CANCELADA" ||
                            o.status === "ENTREGUE"
                          }
                          title={
                            rowBusy
                              ? "Aguarde..."
                              : o.status === "FINALIZADA" ||
                                  o.status === "PAGO" ||
                                  o.status === "CANCELADA" ||
                                  o.status === "ENTREGUE"
                                ? "Use as ações próprias do fluxo para concluir a OS."
                                : "Clique para alterar o status"
                          }
                          style={{
                            ...statusBadgeStyle(o.status),
                            cursor: rowBusy ? "not-allowed" : "pointer",
                            opacity: rowBusy ? 0.7 : 1,
                          }}
                        >
                          {rowBusy ? "..." : STATUS_LABEL[o.status]}
                        </button>
                      </td>
                      <td>{client?.name || "-"}</td>
                      <td>{o.clientCpfCnpj || "-"}</td>
                      <td>{equipmentLabel(o)}</td>
                      <td>
                        <span title={o.symptoms}>{short || "-"}</span>
                        {truncated && (
                          <>
                            {" "}
                            <button
                              type="button"
                              onClick={() => openDetails(o)}
                              disabled={rowBusy}
                              style={{
                                border: "none",
                                background: "transparent",
                                padding: 0,
                                marginLeft: 6,
                                color: "#175cd3",
                                fontWeight: 700,
                                cursor: rowBusy ? "not-allowed" : "pointer",
                                opacity: rowBusy ? 0.7 : 1,
                              }}
                            >
                              ver mais
                            </button>
                          </>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Button type="button" variant="secondary" onClick={() => openView(o)} disabled={rowBusy}>
                            Visualizar
                          </Button>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => (editIsBudget ? openBudget(o) : openEdit(o))}
                            disabled={rowBusy || onlyView}
                            title={
                              onlyView ? "Neste status não é possível editar." : editIsBudget ? "Editar orçamento" : "Editar entrada"
                            }
                          >
                            {editIsBudget ? "Orçamento" : "Editar"}
                          </Button>

                          {o.status === "FINALIZADA" && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => openPayment(o)}
                              disabled={rowBusy}
                              title="Registrar pagamento"
                            >
                              Pagamento
                            </Button>
                          )}

                          {o.status === "PAGO" && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => openPickup(o)}
                              disabled={rowBusy}
                              title="Registrar retirada"
                            >
                              Retirar
                            </Button>
                          )}

                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => openCancel(o)}
                            disabled={
                              rowBusy ||
                              !(allEnabled && (o.status === "ABERTA" || o.status === "EM_ANALISE" || o.status === "AGUARDANDO_APROVACAO"))
                            }
                            title={allEnabled ? "Cancelar OS" : "Este status não pode ser cancelado."}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal
        title="Nova OS (Entrada)"
        subtitle="Digite o CPF/CNPJ para localizar o cliente e preencher os dados do equipamento."
        isOpen={isCreateOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" form="service-order-create-form" disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="service-order-create-form" onSubmit={handleCreate}>
          {createModalError ? <ModalError message={createModalError} /> : null}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Dados do cliente</div>

            <FormGrid>
              <Field label="Buscar por CPF/CNPJ *" full>
                <div className={styles.cpfBox} ref={cpfBoxRef}>
                  <input
                    ref={createCpfInputRef}
                    required
                    value={cpfQuery}
                    onChange={(e) => {
                      if (createCpfInputRef.current) {
                        createCpfInputRef.current.setCustomValidity("");
                      }

                      const v = e.target.value;
                      setCpfQuery(v);
                      setCpfOpen(true);
                      clearClientSelection();

                      const q = normalizeCpfCnpj(v);
                      const exact = clients.find((c: any) => normalizeCpfCnpj(String(c.cpfCnpj || "")) === q);
                      if (exact) applyClientSelection(exact);
                    }}
                    onFocus={() => setCpfOpen(true)}
                    onInvalid={(e) => {
                      e.currentTarget.setCustomValidity("Preencha este campo.");
                    }}
                    onInput={(e) => {
                      (e.currentTarget as HTMLInputElement).setCustomValidity("");
                    }}
                    placeholder="Digite o CPF/CNPJ do cliente…"
                    disabled={modalSaving}
                  />

                  {cpfOpen && cpfQuery.trim().length > 0 && (
                    <div className={styles.dropdown}>
                      {cpfMatches.length === 0 ? (
                        <div className={styles.noResults}>Nenhum cliente encontrado com esse CPF/CNPJ.</div>
                      ) : (
                        cpfMatches.map((c: any) => (
                          <button key={c.id} type="button" className={styles.option} onClick={() => applyClientSelection(c)}>
                            <span className={styles.optionCpf}>{String(c.cpfCnpj || "").trim() || "—"}</span>
                            <span className={styles.optionName}>{c.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Field>

            <Field label="Nome" full>
              <input value={form.clientName} disabled readOnly placeholder="Preenche ao localizar CPF/CNPJ" />
            </Field>

            <Field label="Celular">
              <input value={form.clientPhone} disabled readOnly placeholder="—" />
            </Field>

            <Field label="Email">
              <input value={form.clientEmail} disabled readOnly placeholder="—" />
            </Field>

            <Field label="Endereço" full>
              <input value={form.clientAddress} disabled readOnly placeholder="—" />
            </Field>
          </FormGrid>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do computador</div>

          <FormGrid>
            <Field label="Tipo do equipamento *">
              <input
                required
                value={form.equipmentType}
                onChange={(e) => setForm((p) => ({ ...p, equipmentType: e.target.value }))}
                placeholder="Ex.: Desktop, Notebook"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Marca">
              <input
                value={form.equipmentBrand}
                onChange={(e) => setForm((p) => ({ ...p, equipmentBrand: e.target.value }))}
                placeholder="Ex.: ASUS"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Modelo">
              <input
                value={form.equipmentModel}
                onChange={(e) => setForm((p) => ({ ...p, equipmentModel: e.target.value }))}
                placeholder="Ex.: H310CM-HG4"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Nº de série">
              <input
                value={form.equipmentSerialNumber}
                onChange={(e) => setForm((p) => ({ ...p, equipmentSerialNumber: e.target.value }))}
                placeholder="Opcional"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Senha do equipamento">
              <input
                value={form.equipmentPassword}
                onChange={(e) => setForm((p) => ({ ...p, equipmentPassword: e.target.value }))}
                placeholder="Opcional"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Sintomas *" full>
              <textarea
                required
                value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))}
                rows={4}
                placeholder="Descreva o problema relatado pelo cliente"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Acessórios" full>
              <input
                value={form.accessories}
                onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))}
                placeholder="Ex.: carregador, cabo"
                disabled={modalSaving}
              />
            </Field>
            <Field label="Observações" full>
              <textarea
                value={form.observations}
                onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))}
                rows={3}
                placeholder="Observações gerais (opcional)"
                disabled={modalSaving}
              />
            </Field>
          </FormGrid>
        </div>

        <div style={{ marginTop: 10 }}>
          <Muted>* Campos obrigatórios</Muted>
        </div>
        </form>
      </Modal>

      <Modal
        title="Editar Ordem de Serviço"
        isOpen={isEditOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleEdit} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        {editModalError ? <ModalError message={editModalError} /> : null}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do cliente</div>
          <FormGrid>
            <Field label="CPF/CNPJ na OS" full>
              <input value={form.clientCpfCnpj} disabled readOnly />
            </Field>
            <Field label="Nome" full>
              <input value={form.clientName} disabled readOnly />
            </Field>
            <Field label="Celular">
              <input value={form.clientPhone} disabled readOnly />
            </Field>
            <Field label="Email">
              <input value={form.clientEmail} disabled readOnly />
            </Field>
            <Field label="Endereço" full>
              <input value={form.clientAddress} disabled readOnly />
            </Field>
          </FormGrid>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Dados do computador</div>
          <FormGrid>
            <Field label="Tipo do equipamento *">
              <input value={form.equipmentType} onChange={(e) => setForm((p) => ({ ...p, equipmentType: e.target.value }))} disabled={modalSaving} />
            </Field>
            <Field label="Marca">
              <input value={form.equipmentBrand} onChange={(e) => setForm((p) => ({ ...p, equipmentBrand: e.target.value }))} disabled={modalSaving} />
            </Field>
            <Field label="Modelo">
              <input value={form.equipmentModel} onChange={(e) => setForm((p) => ({ ...p, equipmentModel: e.target.value }))} disabled={modalSaving} />
            </Field>
            <Field label="Nº de série">
              <input
                value={form.equipmentSerialNumber}
                onChange={(e) => setForm((p) => ({ ...p, equipmentSerialNumber: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>
            <Field label="Senha do equipamento">
              <input
                value={form.equipmentPassword}
                onChange={(e) => setForm((p) => ({ ...p, equipmentPassword: e.target.value }))}
                disabled={modalSaving}
              />
            </Field>
            <Field label="Sintomas *" full>
              <textarea value={form.symptoms} onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))} rows={4} disabled={modalSaving} />
            </Field>
            <Field label="Acessórios" full>
              <input value={form.accessories} onChange={(e) => setForm((p) => ({ ...p, accessories: e.target.value }))} disabled={modalSaving} />
            </Field>
            <Field label="Observações" full>
              <textarea value={form.observations} onChange={(e) => setForm((p) => ({ ...p, observations: e.target.value }))} rows={3} disabled={modalSaving} />
            </Field>
          </FormGrid>
        </div>

        <div style={{ marginTop: 10 }}>
          <Muted>* Campos obrigatórios</Muted>
        </div>
      </Modal>

      <Modal
        title="Alterar status"
        subtitle={selected ? `OS #${selected.osNumber} — status atual: ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isStatusOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleStatus} disabled={modalSaving || statusOptions.length === 0}>
              {modalSaving ? "Salvando..." : "Confirmar"}
            </Button>
          </>
        }
        >
        {statusModalError ? <ModalError message={statusModalError} /> : null}
        {statusOptions.length === 0 ? (
          <Muted>Nenhuma transição de status disponível.</Muted>
        ) : (
          <FormGrid>
            <Field label="Novo status *" full>
              <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as ServiceOrderStatus)} disabled={modalSaving}>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
          </FormGrid>
        )}

        <div style={{ marginTop: 10 }}>
          <Muted>* Campos obrigatórios</Muted>
        </div>
      </Modal>

      <Modal
        title="Cancelar OS"
        subtitle={selected ? `Confirme o cancelamento da OS #${selected.osNumber}.` : ""}
        isOpen={isCancelOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Voltar
            </Button>
            <Button type="button" variant="danger" onClick={handleCancel} disabled={modalSaving}>
              {modalSaving ? "Cancelando..." : "Cancelar OS"}
            </Button>
          </>
        }
      >
        {cancelModalError ? <ModalError message={cancelModalError} /> : null}
        <Muted>Você quer mesmo cancelar a OS #{selected?.osNumber}?</Muted>
      </Modal>

      <Modal
        title="Detalhes da OS"
        subtitle={selected ? `OS #${selected.osNumber}` : ""}
        isOpen={isDetailsOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={<Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>Fechar</Button>}
      >
        {selected ? (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Cliente:</strong> {selected.client?.name || "-"} • <strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}
            </div>
            <div>
              <strong>Equipamento:</strong> {equipmentLabel(selected)}
            </div>
            <div>
              <strong>Status:</strong> {STATUS_LABEL[selected.status]}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              <strong>Sintomas:</strong> {selected.symptoms || "-"}
            </div>
          </div>
        ) : (
          <Muted>Sem dados.</Muted>
        )}
      </Modal>

      <Modal
        title="Orçamento"
        subtitle={selected ? `OS #${selected.osNumber} — ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isBudgetOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveBudget} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Salvar orçamento"}
            </Button>
          </>
        }
      >
        {budgetModalError ? <ModalError message={budgetModalError} /> : null}

        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Serviços e valores</div>
            <div style={{ display: "grid", gap: 10 }}>
              {budgetForm.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 90px 140px auto",
                    gap: 8,
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    paddingBottom: 10,
                  }}
                >
                  <input
                    value={it.description}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, description: e.target.value } : x)),
                      }))
                    }
                    placeholder="Descrição do serviço"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.technician}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, technician: e.target.value } : x)),
                      }))
                    }
                    placeholder="Técnico"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.qty}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, qty: e.target.value } : x)),
                      }))
                    }
                    placeholder="Qtd"
                    disabled={modalSaving}
                  />
                  <input
                    value={it.unitValue}
                    onChange={(e) =>
                      setBudgetForm((p) => ({
                        ...p,
                        items: p.items.map((x) => (x.id === it.id ? { ...x, unitValue: e.target.value } : x)),
                      }))
                    }
                    placeholder="Valor unit. (R$)"
                    disabled={modalSaving}
                  />
                  <Button type="button" variant="danger" onClick={() => removeBudgetItem(it.id)} disabled={modalSaving}>
                    Remover
                  </Button>
                </div>
              ))}

              <Button type="button" variant="secondary" onClick={addBudgetItem} disabled={modalSaving}>
                + Adicionar serviço
              </Button>

              <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "8px 0" }} />

              <FormGrid>
                <Field label="Deslocamento (R$)">
                  <input value={budgetForm.travelFee} onChange={(e) => setBudgetForm((p) => ({ ...p, travelFee: e.target.value }))} disabled={modalSaving} />
                </Field>
                <Field label="Serviço de terceiros (R$)">
                  <input
                    value={budgetForm.thirdPartyFee}
                    onChange={(e) => setBudgetForm((p) => ({ ...p, thirdPartyFee: e.target.value }))}
                    disabled={modalSaving}
                  />
                </Field>
                <Field label="Desconto (R$)">
                  <input value={budgetForm.discount} onChange={(e) => setBudgetForm((p) => ({ ...p, discount: e.target.value }))} disabled={modalSaving} />
                </Field>
                <Field label="Observações" full>
                  <textarea value={budgetForm.note} onChange={(e) => setBudgetForm((p) => ({ ...p, note: e.target.value }))} rows={3} disabled={modalSaving} />
                </Field>
              </FormGrid>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Registrar pagamento"
        subtitle={selected ? `OS #${selected.osNumber} • ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isPaymentOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSavePayment} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Registrar pagamento"}
            </Button>
          </>
        }
      >
        {paymentModalError ? <ModalError message={paymentModalError} /> : null}
        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Resumo da OS</div>
              <div><strong>Cliente:</strong> {selected.client?.name || "-"}</div>
              <div><strong>Equipamento:</strong> {equipmentLabel(selected)}</div>
              <div><strong>Total do orçamento:</strong> {selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}</div>
            </div>
            <FormGrid>
              <Field label="Tipo de pagamento *">
                <select
                  value={paymentForm.paymentType}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentType: e.target.value as PaymentType | "" }))}
                  disabled={modalSaving}
                >
                  <option value="">Selecione</option>
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO_CREDITO">Cartão de crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de débito</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="BOLETO">Boleto</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </Field>
              <Field label="Data do pagamento *">
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  disabled={modalSaving}
                />
              </Field>
            </FormGrid>
            <Muted>Ao salvar, a OS será marcada como PAGO.</Muted>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <Muted>* Campos obrigatórios</Muted>
        </div>
      </Modal>

      <Modal
        title="Registrar retirada"
        subtitle={selected ? `OS #${selected.osNumber} • ${STATUS_LABEL[selected.status]}` : ""}
        isOpen={isPickupOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Cancelar
            </Button>
            <Button type="button" variant="primary" onClick={handleSavePickup} disabled={modalSaving}>
              {modalSaving ? "Salvando..." : "Registrar retirada e entregar"}
            </Button>
          </>
        }
      >
        {pickupModalError ? <ModalError message={pickupModalError} /> : null}
        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Resumo da OS</div>
              <div><strong>Cliente:</strong> {selected.client?.name || "-"}</div>
              <div><strong>Tipo de pagamento:</strong> {selected.paymentType ? PAYMENT_TYPE_LABEL[selected.paymentType] : "-"}</div>
              <div><strong>Data do pagamento:</strong> {formatDateOnlyBR(selected.paymentDate)}</div>
            </div>
            <FormGrid>
              <Field label="Data da retirada *">
                <input
                  type="date"
                  value={paymentForm.pickupDate}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, pickupDate: e.target.value }))}
                  disabled={modalSaving}
                />
              </Field>
            </FormGrid>
            <Muted>Ao salvar, a OS será marcada como ENTREGUE.</Muted>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <Muted>* Campos obrigatórios</Muted>
        </div>
      </Modal>

      <Modal
        title="Visualizar"
        subtitle={
          selected
            ? `OS #${selected.osNumber} • ${STATUS_LABEL[selected.status]} • Entrada: ${formatDateTimeBR(
                selected.entryDate || selected.createdAt
              )}`
            : ""
        }
        isOpen={isViewOpen}
        onClose={closeAllModals}
        disableClose={modalSaving}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (selected) printCurrentDocument(selected, viewMode);
              }}
              disabled={modalSaving || !selected}
            >
              Imprimir / PDF
            </Button>
            <Button type="button" variant="secondary" onClick={closeAllModals} disabled={modalSaving}>
              Fechar
            </Button>
          </>
        }
      >
        {!selected ? (
          <Muted>Sem dados.</Muted>
        ) : viewMode === "ENTRY" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gap: 8,
                paddingBottom: 10,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Comprovante de Entrada</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div><strong>Nº OS:</strong> {selected.osNumber}</div>
                <div><strong>Data de entrada:</strong> {formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
                <div><strong>Status:</strong> {STATUS_LABEL[selected.status]}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div><strong>Nome:</strong> {responsibleName(selected)}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div><strong>Nome:</strong> {selected.client?.name || "-"}</div>
              <div><strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}</div>
              <div><strong>Telefone:</strong> {selected.client?.phone || "-"}</div>
              <div><strong>Email:</strong> {selected.client?.email || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Equipamento</div>
              <div><strong>Equipamento:</strong> {equipmentLabel(selected)}</div>
              <div><strong>Marca:</strong> {selected.equipmentBrand || "-"}</div>
              <div><strong>Modelo:</strong> {selected.equipmentModel || "-"}</div>
              <div><strong>Nº de série:</strong> {selected.equipmentSerialNumber || "-"}</div>
              <div><strong>Senha:</strong> {selected.equipmentPassword || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Defeito / Reclamação</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{selected.symptoms || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Acessórios</div>
              <div>{selected.accessories || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Observações da OS</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{selected.observations || "-"}</div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800 }}>Observações importantes</div>
              <div style={{ display: "grid", gap: 4 }}>
                {ENTRY_NOTES_TEXT.map((line: string) => (
                  <div key={line}>• {line}</div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === "BUDGET" ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gap: 8,
                paddingBottom: 10,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Orçamento da Ordem de Serviço</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div><strong>Nº OS:</strong> {selected.osNumber}</div>
                <div><strong>Entrada:</strong> {formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
                <div><strong>Status:</strong> {STATUS_LABEL[selected.status]}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div><strong>Nome:</strong> {responsibleName(selected)}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div><strong>Nome:</strong> {selected.client?.name || "-"}</div>
              <div><strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}</div>
              <div><strong>Telefone:</strong> {selected.client?.phone || "-"}</div>
              <div><strong>Email:</strong> {selected.client?.email || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Equipamento</div>
              <div><strong>Equipamento:</strong> {equipmentLabel(selected)}</div>
              <div><strong>Marca:</strong> {selected.equipmentBrand || "-"}</div>
              <div><strong>Modelo:</strong> {selected.equipmentModel || "-"}</div>
              <div><strong>Nº de série:</strong> {selected.equipmentSerialNumber || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Defeito / Reclamação</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{selected.symptoms || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800 }}>Serviços a executar</div>
              {!selected.budget ? (
                <Muted>Nenhum orçamento encontrado para esta OS.</Muted>
              ) : selected.budget.items?.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {selected.budget.items.map((it) => {
                    const lineTotal = Number(it.qty || 0) * toMoneyNumber(it.unitValue);

                    return (
                      <div
                        key={it.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 10,
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          paddingBottom: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{it.description}</div>
                          <div style={{ fontSize: 12, color: "#667085" }}>
                            Técnico responsável: {it.technician || "-"} • Qtd: {it.qty}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800 }}>R$ {lineTotal.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Muted>Nenhum serviço adicionado ainda.</Muted>
              )}
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Totais do Orçamento</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal (serviços)</span>
                <strong>R$ {selected.budget ? calcBudgetItemsTotal(selected.budget.items).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Deslocamento</span>
                <strong>R$ {selected.budget ? toMoneyNumber(selected.budget.travelFee).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Serviço de terceiros</span>
                <strong>R$ {selected.budget ? toMoneyNumber(selected.budget.thirdPartyFee).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Desconto</span>
                <strong>- R$ {selected.budget ? toMoneyNumber(selected.budget.discount).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                <span style={{ fontWeight: 800 }}>Total</span>
                <span style={{ fontWeight: 900 }}>
                  {selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800 }}>Condições de pagamento</div>
              <div>{BUDGET_PAYMENT_CONDITIONS_TEXT}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Validade</div>
              <div>{BUDGET_VALIDITY_TEXT}</div>
            </div>

            {selected.budget?.note && (
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800 }}>Observações do orçamento</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{selected.budget.note}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gap: 8,
                paddingBottom: 10,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>Comprovante de Pagamento</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div><strong>Nº OS:</strong> {selected.osNumber}</div>
                <div><strong>Data de entrada:</strong> {formatDateTimeBR(selected.entryDate || selected.createdAt)}</div>
                <div><strong>Status:</strong> {STATUS_LABEL[selected.status]}</div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Responsável pela OS</div>
              <div><strong>Nome:</strong> {responsibleName(selected)}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Cliente</div>
              <div><strong>Nome:</strong> {selected.client?.name || "-"}</div>
              <div><strong>CPF/CNPJ:</strong> {selected.clientCpfCnpj || "-"}</div>
              <div><strong>Telefone:</strong> {selected.client?.phone || "-"}</div>
              <div><strong>Email:</strong> {selected.client?.email || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Dados do Equipamento</div>
              <div><strong>Equipamento:</strong> {equipmentLabel(selected)}</div>
              <div><strong>Marca:</strong> {selected.equipmentBrand || "-"}</div>
              <div><strong>Modelo:</strong> {selected.equipmentModel || "-"}</div>
              <div><strong>Nº de série:</strong> {selected.equipmentSerialNumber || "-"}</div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 800 }}>Serviços executados</div>
              {selected.budget?.items?.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {selected.budget.items.map((it) => {
                    const lineTotal = Number(it.qty || 0) * toMoneyNumber(it.unitValue);

                    return (
                      <div
                        key={it.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 10,
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          paddingBottom: 6,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700 }}>{it.description}</div>
                          <div style={{ fontSize: 12, color: "#667085" }}>
                            Técnico responsável: {it.technician || "-"} • Qtd: {it.qty}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800 }}>R$ {lineTotal.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Muted>Nenhum serviço registrado no orçamento.</Muted>
              )}
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Pagamento e retirada</div>
              <div>
                <strong>Tipo de pagamento:</strong>{" "}
                {selected.paymentType ? PAYMENT_TYPE_LABEL[selected.paymentType] : "-"}
              </div>
              <div><strong>Data do pagamento:</strong> {formatDateOnlyBR(selected.paymentDate)}</div>
              <div><strong>Data da retirada:</strong> {formatDateOnlyBR(selected.pickupDate)}</div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Totais</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal (serviços)</span>
                <strong>R$ {selected.budget ? calcBudgetItemsTotal(selected.budget.items).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Deslocamento</span>
                <strong>R$ {selected.budget ? toMoneyNumber(selected.budget.travelFee).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Serviço de terceiros</span>
                <strong>R$ {selected.budget ? toMoneyNumber(selected.budget.thirdPartyFee).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Desconto</span>
                <strong>- R$ {selected.budget ? toMoneyNumber(selected.budget.discount).toFixed(2) : "0.00"}</strong>
              </div>
              <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "6px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
                <span style={{ fontWeight: 800 }}>Total</span>
                <span style={{ fontWeight: 900 }}>
                  {selected.budget ? `R$ ${calcBudgetTotal(selected.budget).toFixed(2)}` : "—"}
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                paddingTop: 10,
                borderTop: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontWeight: 800 }}>Garantia</div>
              <div style={{ display: "grid", gap: 4 }}>
                {WARRANTY_TEXT.map((line) => (
                  <div key={line}>• {line}</div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800 }}>Declaração de recebimento</div>
              <div>{PAYMENT_RECEIPT_DECLARATION_TEXT}</div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}




