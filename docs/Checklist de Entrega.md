## Checklist de Entrega — Desenvolvimento de Software em Nuvem

### 1) Requisitos Funcionais (Doc original)
- [x] Autenticacao e autorizacao (JWT + roles ADMIN/TECNICO no backend e rota protegida no frontend).
- [x] API REST documentada com Swagger/OpenAPI.
- [x] Operacoes CRUD completas para entidades do sistema (clientes, OS, usuarios).
- [ ] Validacao de dados no back-end com retorno padronizado de erro (Zod validando, mas faltam respostas de validacao 100% consistentes).
- [x] Registro de logs de acesso e erro no backend.

### 2) Arquitetura Tecnica Obrigatoria
- [x] Front-end com React (moderno).
- [ ] Deploy em servico de nuvem (frontend: Vercel preparado, validar deploy ativo e URL no README).
- [x] Back-end containerizado com Docker.
- [ ] Deploy em servico de nuvem para o back-end (CI/CD configurado; validar prova de deploy ativo e URL no README).
- [x] Banco PostgreSQL por datasource externo (via `DATABASE_URL`).
- [ ] Evidencia explicita de persistencia fora do container (colocar no README a instancia em nuvem usada: Supabase/Neon/RDS/etc).

### 3) DevOps e Nuvem
- [x] Docker no back-end.
- [x] Pipeline com build e testes (GitHub Actions em backend e frontend).
- [x] Pipeline inclui deploy automatico (webhooks no fluxo CI).

### 4) Seguranca e Boas Praticas
- [x] Uso de variaveis de ambiente (ex.: `DATABASE_URL`, `JWT_SECRET`, `PORT`).
- [ ] Remover fallback de `JWT_SECRET` inseguro no codigo (`backend/src/config/env.ts`) e falhar explicitamente quando nao configurado.
- [x] Protecao de rotas autenticadas no backend e frontend.
- [x] Tratamento centralizado de erro no backend.
- [ ] Separacao melhorada dev/prod (comportamento de erro e secrets por ambiente, sem fallback permissivo).

### 5) Testes e Qualidade
- [x] Testes de API no backend (Vitest + Supertest).
- [x] Testes no frontend (login, rota protegida, dashboard).
- [x] Evidencia de execucao (logs de pipeline com sucesso, opcional: cobertura).

### Evidencias de Validacao da Tarefa 5
- [x] backend passou em GitHub Actions (Install, Build and Test) com sucesso.
- [x] frontend passou em GitHub Actions (Install, Build and Test) com sucesso.
- [x] deploy executado no CI com status de sucesso (webhooks acionados conforme configuracao).

### 6) Colaboracao e Organizacao
- [ ] Fluxo publico no GitHub, branches por funcionalidade e commits semanticos (nao da para validar apenas pelo codigo local).
- [ ] Evidencia de Issues/Projetos (Kanban) no repositorio GitHub.

### 7) Entregaveis
- [x] Repositorio com codigo, Dockerfile e README detalhado.
- [x] Diagrama/descricao de arquitetura presente em `docs/arquitetura-diagrama.md`.
- [ ] Relatorio tecnico (ate 6 paginas) ainda nao encontrado.
- [ ] Video de ate 7 minutos ainda nao incluido.

---

## Pendencias criticas (fechar antes da entrega final)
1. [ ] Ajustar tratamento de erro do Zod para retornar `400` de validacao de forma consistente.
2. [ ] Remover fallback de `JWT_SECRET` e exigir configuracao explicita.
3. [x] Etapa de deploy automatico no CI/CD para backend já adicionada no workflow.
4. [ ] Adicionar prova de deploy do frontend/backend no README (links ativos).
5. [ ] Incluir itens faltantes de entrega academica: relatorio tecnico e video.

## Plano de correcao em 7 tarefas (ordem de execucao)

Objetivo: transformar os itens pendentes em entregaveis aprovaveis com menor risco e maximo impacto.

1) [ ] Validar erros de entrada no backend (Alta, esforco: 1h)
- Consolidar `ZodError` no `backend/src/middlewares/error-handler.ts`.
- Retornar `400` com `details` de validacao para `parse` e parametros obrigatorios.
- Garantir resposta padronizada de erro para frontend/testes.

2) [ ] Ajustar parametros obrigatorios com erro de cliente (Media, esforco: 30min)
- Revisar `backend/src/shared/http/get-required-param.ts` e `backend/src/utils/get-required-param.ts`.
- Trocar erro generico por `HttpError.badRequest`.
- Definir mensagem e codigo consistentes.

3) [ ] Endurecer segredos de ambiente (Alta, esforco: 30min)
- Alterar `backend/src/config/env.ts` para falhar quando `JWT_SECRET` faltar.
- Remover fallback inseguro.
- Documentar no README variaveis obrigatorias e exemplo minimo.

4) [x] Incluir deploy automatico no CI/CD (Alta, esforco: 1h30)
- Workflow de deploy atualizado com gatilho de deploy e webhooks.
- Secrets definidos no GitHub Actions.
- Publicar e validar URL final no README.

5) [ ] Finalizar evidencia de deploy front-end e back-end (Media, esforco: 45min)
- Confirmar `frontend/vercel.json` e registrar URL de producao no README.
- Registrar link ativo do endpoint backend em producao e smoke test de `/health` ou `/api/docs`.

6) [x] Ajustar testes frontend para a implementacao atual (Media, esforco: 1h)
- Revisar `frontend/tests/DashboardPage.test.tsx`.
- Sincronizar os asserts com o componente real (texto/botoes existentes).
- Executar `npm run test:run` em frontend e backend.

7) [ ] Entregaveis academicos finais (Baixa, esforco: 2h)
- Criar relatorio tecnico (ate 6 paginas) em `docs/relatorio-tecnico.md`.
- Gravar video de ate 7 minutos com arquitetura, funcionalidades e deploy.
- Atualizar checklist de entrega com status final dos itens 7 e links.

