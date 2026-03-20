# Arquitetura — ComprovOS

## Visão Geral
O ComprovOS é um sistema web para gerenciamento de ordens de serviço (OS) e acompanhamento de manutenção de equipamentos em assistência técnica.

## Arquitetura em Nuvem (Camadas)
- **Frontend (React + Vite)**: interface web para equipe técnica (painel interno) e, opcionalmente, acompanhamento do cliente.
- **Backend (Node.js + Express)**: API REST com autenticação, CRUDs, validações, logs e documentação Swagger.
- **Banco de Dados (PostgreSQL + Prisma)**: persistência em serviço gerenciado na nuvem (Supabase/Neon).

## Fluxo Principal
1. Técnico realiza login no sistema.
2. Frontend envia credenciais para a API.
3. API autentica com JWT.
4. Técnicos gerenciam clientes, equipamentos e ordens de serviço.
5. Dados são persistidos no PostgreSQL.
6. API expõe documentação em `/docs`.

## Deploy (Implementado)
- **Frontend**: https://comprovos.vercel.app (Vercel)
- **Backend**: https://comprovos-backend.onrender.com (Render com Docker)
- **Banco**: PostgreSQL gerenciado via `DATABASE_URL` (Supabase/Neon conforme ambiente)

## Segurança e Qualidade
- JWT para autenticação
- Rotas protegidas por perfil
- Variáveis de ambiente
- Logs de acesso e erro
- Testes automatizados