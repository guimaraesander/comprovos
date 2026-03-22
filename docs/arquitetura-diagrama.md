# Arquitetura - ComprovOS

Documento de apoio. A versao consolidada para entrega esta em `docs/relatorio-tecnico.md`.

## Visao Geral

O ComprovOS e um sistema web para gerenciamento de ordens de servico, clientes e acompanhamento de manutencao em assistencia tecnica.

## Arquitetura em Nuvem

- **Frontend (React + Vite):** interface web para a equipe interna, publicada na Vercel.
- **Backend (Node.js + Express):** API REST com autenticacao, CRUDs, validacoes, logs e documentacao Swagger/OpenAPI, publicada no Render com Docker.
- **Banco de dados (PostgreSQL + Prisma):** persistencia em servico gerenciado na nuvem, acessado por `DATABASE_URL`.

## Fluxo Principal

1. O usuario realiza login no frontend.
2. O frontend envia as credenciais para a API.
3. A API autentica o usuario com JWT.
4. A aplicacao permite gerenciar clientes, usuarios e ordens de servico.
5. Os dados sao persistidos no PostgreSQL.
6. A documentacao da API fica disponivel em `/api-docs`.

## Enderecos de Producao

- **Frontend:** <https://comprovos.vercel.app>
- **Backend:** <https://comprovos-backend.onrender.com>
- **API Docs:** <https://comprovos-backend.onrender.com/api-docs>

## Qualidade e Seguranca

- Autenticacao com JWT.
- Protecao de rotas autenticadas.
- Uso de variaveis de ambiente.
- Logs de acesso e erro.
- Testes automatizados no backend e no frontend.
