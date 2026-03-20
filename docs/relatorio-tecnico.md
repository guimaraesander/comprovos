# Relatório Técnico — ComprovOS

## 1) Identificação do projeto

- Projeto: **ComprovOS**
- Disciplina: **Desenvolvimento de Software em Nuvem**
- Período: **2026**
- Repositório: <https://github.com/guimaraesander/comprovos>
- Módulos principais: `backend/`, `frontend/`, `.github/workflows/`, `docs/`

## 2) Objetivo do trabalho

Desenvolver e implantar uma aplicação web para controle de ordens de serviço e clientes de assistência técnica, composta por:

- autenticação e autorização com JWT e controle por perfil
- API RESTful para operações de negócio
- interface web para operação interna
- persistência em banco relacional gerenciado
- documentação técnica da API (Swagger/OpenAPI)
- observabilidade básica, testes automatizados e pipeline CI/CD com deploy

## 3) Arquitetura implementada

### 3.1 Arquitetura geral

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Banco:** PostgreSQL (serviço gerenciado)
- **ORM:** Prisma
- **Autenticação:** JWT
- **Documentação de API:** Swagger/OpenAPI

### 3.2 Camadas e responsabilidades

- **Frontend:** rotas protegidas, autenticação do usuário e consumo da API.
- **Backend (camada de rotas/controle):** endpoints REST por domínio (`clients`, `users`, `service-orders`, `auth`).
- **Backend (camada de serviço):** regras de negócio e transições de status.
- **Persistência:** Prisma para acesso e modelagem de dados.
- **Infraestrutura:** Docker para o backend e pipelines em GitHub Actions.

### 3.3 Comunicação

- O frontend consome o backend pela variável `VITE_API_URL` (`/api`).
- A API expõe rotas e documentação em `/api` e `/api-docs`.
- Deploy de produção registrado em:
  - Frontend: <https://comprovos.vercel.app>
  - Backend: <https://comprovos-backend.onrender.com>

## 4) Requisitos atendidos

## 4.1 Requisitos funcionais

- Autenticação/autorização (JWT + perfis ADMIN/TECNICO): **atendido**
- API documentada (Swagger/OpenAPI): **atendido**
- Operações CRUD completas (clientes, usuários, ordens): **atendido**
- Validação de dados no backend: **atendido (com handler central de validação/erros)**
- Logs de acesso e erro: **atendido**

## 4.2 Requisitos de arquitetura e nuvem

- Front-end moderno (React): **atendido**
- Front-end em nuvem (Vercel): **atendido**
- Backend containerizado (Docker): **atendido**
- Deploy em nuvem do backend: **atendido**
- Banco gerenciado fora do container: **atendido** (via `DATABASE_URL`)

## 4.3 DevOps e operações

- Pipeline com build e testes no backend: **atendido**
- Pipeline com build e testes no frontend: **atendido**
- Deploy automático via CI/CD: **atendido** (webhooks)
- Evidência de execução publicada no repositório: **atendido** (workflow)

## 4.4 Segurança e boas práticas

- Uso de variáveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`): **atendido**
- Proteção de rotas autenticadas: **atendido**
- Tratamento centralizado de erros: **atendido**
- Separação dev/test/prod observável no runtime: **atendido (em evolução, sem fallback inseguro de segredos)**

## 4.5 Testes e qualidade

- Testes de backend com Vitest + Supertest: **atendido**
- Testes de frontend (mínimo e relevantes): **atendido**
- Cobertura automática: **pendente** (comando disponível, conforme versão do ambiente local)

## 4.6 Colaboração (itens acadêmicos)

- Repositório público: **pendente (validar no repositório final)**
- Branches por funcionalidade: **pendente (validar histórico)**
- Commits semânticos: **pendente (validar histórico)**
- Issues/Kanban no GitHub: **pendente (validar no repositório final)**

## 5) Evidências técnicas

- Workflow CI/CD: `.github/workflows/ci.yml`
- Deploy e validação: <https://github.com/guimaraesander/comprovos/actions/workflows/ci.yml>
- Backend em produção: <https://comprovos-backend.onrender.com>
- Frontend em produção: <https://comprovos.vercel.app>
- API docs: <https://comprovos-backend.onrender.com/api-docs>
- Health check: <https://comprovos-backend.onrender.com/health>

## 6) Decisões técnicas e riscos controlados

Durante o desenvolvimento, foi registrada uma advertência de compatibilidade do Prisma:

- O projeto usa `datasource` com `url` em `backend/prisma/schema.prisma`.
- Há aviso de migração para o novo formato em versões mais recentes da ferramenta.
- A alteração desta configuração foi mantida postergada para não introduzir regressão imediatamente antes da entrega.

Este ponto está documentado como limitação técnica e não impede o funcionamento atual da solução.

## 7) Execução e validação realizada

- Testes automatizados do frontend e backend executados com sucesso no estado atual de implementação.
- Correções realizadas para garantir comportamento de erro amigável na autenticação.
- Pipeline principal executado com sucesso em ambiente de integração.
- Interface e fluxo de login validados para:
  - credenciais válidas;
  - credenciais inválidas (mensagem amigável);
  - indisponibilidade de backend (mensagem de conexão).

## 8) Conclusão

A solução cumpre os requisitos técnicos centrais da disciplina, com arquitetura em nuvem, backend em container, documentação de API, autenticação protegida, rotinas de teste e pipeline com CI/CD.

Pontos pendentes para encerramento acadêmico final:

- comprovar formalmente aspectos de governança no GitHub (colaboração e workflow público);
- incluir vídeo de demonstração (até 7 min) com link em `docs/video-demonstracao.md`.

Portanto, no que tange ao funcionamento técnico e requisitos arquiteturais, o projeto encontra-se apto para entrega.
