## ✅ Checklist de Entrega — Desenvolvimento de Software em Nuvem

### 1) Requisitos Funcionais (Doc original)
- [x] Autenticação e autorização (JWT + roles ADMIN/TECNICO no backend e rota protegida no frontend).
- [x] API REST documentada com Swagger/OpenAPI.
- [x] Operações CRUD completas para entidades do sistema (clientes, OS, usuários).
- [ ] Validação de dados no back-end com retorno padronizado de erro (Zod validando, mas faltam respostas de validação 100% consistentes).
- [x] Registro de logs de acesso e erro no backend.

### 2) Arquitetura Técnica Obrigatória
- [x] Front-end com React (moderno).
- [ ] Deploy em serviço de nuvem (frontend: Vercel preparado, validar deploy ativo e URL no README).
- [x] Back-end containerizado com Docker.
- [ ] Deploy em serviço de nuvem para o back-end (atualmente não há deploy automático configurado no CI/CD).
- [x] Banco PostgreSQL por datasource externo (via `DATABASE_URL`).
- [ ] Evidência explícita de persistência fora do container (colocar no README a instância em nuvem usada: Supabase/Neon/RDS/etc).

### 3) DevOps e Nuvem
- [x] Docker no back-end.
- [x] Pipeline com build e testes (GitHub Actions em backend e frontend).
- [ ] Pipeline inclui deploy automático (faltando etapa de deploy no fluxo CI).

### 4) Segurança e Boas Práticas
- [x] Uso de variáveis de ambiente (ex.: `DATABASE_URL`, `JWT_SECRET`, `PORT`).
- [ ] Remover fallback de `JWT_SECRET` inseguro no código (`backend/src/config/env.ts`) e falhar explicitamente quando não configurado.
- [x] Proteção de rotas autenticadas no backend e frontend.
- [x] Tratamento centralizado de erro no backend.
- [ ] Separação melhorada dev/prod (comportamento de erro e secrets por ambiente, sem fallback permissivo).

### 5) Testes e Qualidade
- [x] Testes de API no backend (Vitest + Supertest).
- [x] Testes no frontend (login, rota protegida, dashboard).
- [ ] Evidência de execução (logs de pipeline com sucesso, opcional: cobertura).

### 6) Colaboração e Organização
- [ ] Fluxo público no GitHub, branches por funcionalidade e commits semânticos (não dá para validar apenas pelo código local).
- [ ] Evidência de Issues/Projetos (Kanban) no repositório GitHub.

### 7) Entregáveis
- [x] Repositório com código, Dockerfile e README detalhado.
- [x] Diagrama/descrição de arquitetura presente em `docs/arquitetura-diagrama.md`.
- [ ] Relatório técnico (até 6 páginas) ainda não encontrado.
- [ ] Vídeo de até 7 minutos ainda não incluído.

---

## ⚠️ Pendências críticas (fechar antes da entrega final)
1. [ ] Ajustar tratamento de erro do Zod para retornar `400` de validação de forma consistente.
2. [ ] Remover fallback de `JWT_SECRET` e exigir configuração explícita.
3. [ ] Adicionar etapa de deploy automático no CI/CD para backend (Render/Railway/AWS/etc).
4. [ ] Adicionar prova de deploy do frontend/backend no README (links ativos).
5. [ ] Incluir itens faltantes de entrega acadêmica: relatório técnico e vídeo.

## Plano de correção em 7 tarefas (ordem de execução)

Objetivo: transformar os itens pendentes em entregáveis aprováveis com menor risco e máximo impacto.

1) [ ] Validar erros de entrada no backend (Alta, esforço: 1h)
- Consolidar `ZodError` no `backend/src/middlewares/error-handler.ts`.
- Retornar `400` com `details` de validação para `parse` e parâmetros obrigatórios.
- Garantir resposta padronizada de erro para frontend/testes.

2) [ ] Ajustar parâmetros obrigatórios com erro de cliente (Média, esforço: 30min)
- Revisar `backend/src/shared/http/get-required-param.ts` e `backend/src/utils/get-required-param.ts`.
- Trocar erro genérico por `HttpError.badRequest`.
- Definir mensagem e código consistentes.

3) [ ] Endurecer segredos de ambiente (Alta, esforço: 30min)
- Alterar `backend/src/config/env.ts` para falhar quando `JWT_SECRET` faltar.
- Remover fallback inseguro.
- Documentar no README variáveis obrigatórias e exemplo mínimo.

4) [ ] Incluir deploy automático no CI/CD (Alta, esforço: 1h30)
- Atualizar `.github/workflows/ci.yml` com etapa de deploy backend (Render/Railway/AWS).
- Definir secrets de CI no GitHub para deploy.
- Publicar e validar URL final no README.

5) [ ] Finalizar evidência de deploy front-end e back-end (Média, esforço: 45min)
- Confirmar `frontend/vercel.json` e registrar URL de produção no README.
- Registrar link ativo do endpoint backend em produção e smoke test de `/health` ou `/api/docs`.

6) [ ] Ajustar testes frontend para a implementação atual (Média, esforço: 1h)
- Revisar `frontend/tests/DashboardPage.test.tsx`.
- Sincronizar os asserts com o componente real (texto/botões existentes).
- Executar `npm run test:run` em frontend e backend.

7) [ ] Entregáveis acadêmicos finais (Baixa, esforço: 2h)
- Criar relatório técnico (até 6 páginas) em `docs/relatorio-tecnico.md`.
- Gravar vídeo de até 7 minutos com arquitetura, funcionalidades e deploy.
- Atualizar checklist de entrega com status final dos itens 7 e links.
