## Checklist de Entrega - Desenvolvimento de Software em Nuvem

Documento de apoio interno para acompanhamento da entrega. O documento final consolidado e `docs/relatorio-tecnico.md`.

### 1) Requisitos Funcionais (Doc original)
- [x] Autenticacao e autorizacao (JWT + roles ADMIN/TECNICO no backend e rota protegida no frontend).
- [x] API REST documentada com Swagger/OpenAPI.
- [x] Operacoes CRUD completas para entidades do sistema (clientes, OS, usuarios).
- [x] Validacao de dados no back-end com retorno padronizado de erro (Zod validando, com retorno de 400 e details).
- [x] Registro de logs de acesso e erro no backend.

### 2) Arquitetura Tecnica Obrigatoria
- [x] Front-end com React (moderno).
- [x] Deploy em servico de nuvem (frontend: Vercel ativo com URL no README).
- [x] Back-end containerizado com Docker.
- [x] Deploy em servico de nuvem para o back-end (CI/CD com webhook e URL ativa no README).
- [x] Banco PostgreSQL por datasource externo (via `DATABASE_URL`).
- [x] Evidencia explicita de persistencia fora do container no README (instancia SQL gerenciada via `DATABASE_URL`).

### 3) DevOps e Nuvem
- [x] Docker no back-end.
- [x] Pipeline com build e testes (GitHub Actions em backend e frontend).
- [x] Pipeline inclui deploy automatico (webhooks no fluxo CI).

### 4) Seguranca e Boas Praticas
- [x] Uso de variaveis de ambiente (ex.: `DATABASE_URL`, `JWT_SECRET`, `PORT`).
- [x] Remover fallback de `JWT_SECRET` inseguro no codigo (`backend/src/config/env.ts`) e falhar explicitamente quando nao configurado.
- [x] Protecao de rotas autenticadas no backend e frontend.
- [x] Tratamento centralizado de erro no backend.
- [x] Separacao melhorada dev/prod (comportamento de erro e secrets por ambiente, sem fallback permissivo).

### 5) Testes e Qualidade
- [x] Testes de API no backend (Vitest + Supertest).
- [x] Testes no frontend (login, rota protegida, dashboard).
- [x] Evidencia de execucao (logs de pipeline com sucesso e cobertura gerada).

### 6) Colaboracao e Organizacao
- [ ] Fluxo publico no GitHub, branches por funcionalidade e commits semanticos (validacao pendente no repositorio remoto).
- [ ] Evidencia de Issues/Projetos (Kanban) no repositorio GitHub.

### 7) Entregaveis
- [x] Repositorio com codigo, Dockerfile e README detalhado.
- [x] Diagrama/descricao de arquitetura presente em `docs/arquitetura-diagrama.md`.
- [x] Relatorio tecnico (ate 6 paginas) em `docs/relatorio-tecnico.md`.
- [ ] Video de ate 7 minutos ainda nao incluido (`docs/video-demonstracao.md` aguardando URL publica da gravacao).

---

## Pendencias criticas (fechar antes da entrega final)

1. [x] Ajustar tratamento de erro do Zod para retornar `400` de validacao de forma consistente.
2. [x] Remover fallback de `JWT_SECRET` e exigir configuracao explicita.
3. [x] Etapa de deploy automatico no CI/CD para backend adicionada no workflow.
4. [x] Adicionar prova de deploy do frontend/backend no README (links ativos).
5. [ ] Registrar link da demonstracao em `docs/video-demonstracao.md` (e opcionalmente no README), e validar se segue o tempo limite.
