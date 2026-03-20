# Relatorio Tecnico - ComprovOS

## 1. Identificacao

- Projeto: ComprovOS
- Disciplina: Desenvolvimento de Software em Nuvem
- Periodo: 2026
- Integrantes: a completar pela equipe
- Repositorio: https://github.com/guimaraesander/comprovos

## 2. Objetivo

O ComprovOS e uma aplicacao web para controle de ordem de servico e clientes de assistencia tecnica.
O objetivo foi entregar uma aplicacao completa com:

- Autenticacao e autorizacao (JWT)
- CRUD de clientes, usuarios e ordens de servico
- Status de ordens e controle de orcamentos
- Documentacao de API com Swagger/OpenAPI
- Observabilidade basica com logs estruturados
- CI/CD com build, testes e deploy continuo

## 3. Arquitetura

### Arquitetura geral

- Frontend: React + Vite + TypeScript
- API: Node.js + Express + TypeScript
- Banco: PostgreSQL (servico gerenciado)
- ORM: Prisma

### Divisao de responsabildades

- Camada de rota/controle: rotas e controllers por modulo
- Camada de servico: regras de negocio
- Persistencia: prisma schemas e Prisma Client
- Infra: Docker para backend e workflows no GitHub Actions para CI/CD

### Comunicacao

- Frontend consome API via Axios
- Base path da API: `/api`
- Docs da API: `/api-docs`

## 4. Deploy e nuvem

- Frontend: Vercel
- Backend: Render
- Banco de dados: URL de conexao externa via `DATABASE_URL`
- CI/CD: GitHub Actions com jobs backend, frontend e deploy via webhooks

## 5. Segurança e boas praticas

- Uso de variaveis de ambiente para segredos e configuracoes (JWT_SECRET, DATABASE_URL, PORT, NODE_ENV)
- Erros centralizados em middleware com retorno padronizado e logs estruturados
- Rotas protegidas por middleware de autenticacao e roles
- Fallback de variaveis obrigatorias removido para evitar deploys sem segredo configurado

## 6. Testes e qualidade

- Backend: testes com Vitest + Supertest
- Frontend: testes com Vitest + Testing Library
- Cobertura gerada com `npm run test:coverage` em backend e frontend
- Resultados do CI divulgados em `.github/workflows/ci.yml`

## 7. Contribuicoes da equipe

- Estruturacao do backend em modulos por dominio
- Implementacao de CRUD e regras de transicao de status
- Implementacao de middlewares de autenticacao e tratamento de erro
- Configuracao de CI/CD e ajustes de deploy

## 8. Dificuldades e solucao

- Configuracao de workflow com dependencias divergentes entre ambiente local e GitHub
- Ajuste de lockfile e scripts para reduzir falhas de CI
- Padronizacao de erros de validacao via handler central
- Ajustes de ambiente para garantir comportamento explicito por contexto

## 9. Conclusao

O projeto atendeu os requisitos principais de uma aplicacao para nuvem com backend containerizado,
CI/CD automatizado e validacao de qualidade. As pendencias remanescentes no momento sao pontuais e de natureza documental/apresentacao:

- Evidencias operacionais: URLs de deploy e logs de CI/CD ativos.
- Demostracao em video: gerar e anexar o link publico em `docs/video-demonstracao.md`.
- Evidencia de governanca no GitHub (issues/kanban/branches semanticas): validar no repositorio remoto.

Conclusao: tecnicamente o sistema encontra-se apto para entrega de requisitos funcionais e arquitetura em nuvem, com ajustes finais de evidenciacao academica.
