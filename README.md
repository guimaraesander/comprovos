# ComprovOS

Sistema web para assistência técnica de computadores, substituindo o comprovante em papel por um fluxo digital de cadastro de clientes, equipamentos, ordens de serviço, autenticação e acompanhamento em nuvem.

## 1. Objetivo

Projeto desenvolvido para a disciplina **Desenvolvimento de Software em Nuvem**, com foco em:

- Front-end web moderno com React.
- API REST em Node.js/Express.
- Autenticação e autorização com perfis.
- Banco PostgreSQL gerenciado na nuvem.
- Documentação de API com Swagger/OpenAPI.
- CI/CD com testes automatizados e deploy.

## 2. Stack

### Front-end

- React
- Vite
- TypeScript
- Axios
- React Router

### Back-end

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- Swagger / OpenAPI
- Vitest + Supertest

### Infraestrutura

- Docker
- GitHub Actions
- Vercel
- Render
- PostgreSQL em serviço gerenciado

## 3. Estrutura do projeto

```text
comprovos/
├─ backend/
│  ├─ prisma/
│  ├─ src/
│  ├─ .env.example
│  ├─ package.json
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  ├─ .env.example
│  ├─ package.json
│  └─ vite.config.ts
├─ docs/
│  ├─ Checklist de Entrega.md
│  ├─ checklist-requisitos.md
│  ├─ Desenvolvimento de Software em Nuvem.md
│  ├─ arquitetura-diagrama.md
│  ├─ relatorio-tecnico.md
│  └─ video-demonstracao.md
├─ .github/
│  └─ workflows/
│     └─ ci.yml
├─ package.json
└─ README.md
```

## 4. Funcionalidades

- Login com autenticação JWT.
- Rotas protegidas no frontend por perfil.
- Dashboard interno.
- Cadastro e gerenciamento de clientes.
- Cadastro e acompanhamento de ordens de serviço.
- Controle de transição de status e orçamentos.
- Documentação interativa da API (`/api-docs`).

## 5. Pré-requisitos

- Git
- Node.js 22 LTS (ou versão compatível)
- npm
- PostgreSQL

## 6. Variáveis de ambiente

### Backend (`backend/.env`)

Copie a partir de `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Exemplo:

```env
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@SEU_HOST:5432/seubanco"
JWT_SECRET="troque-por-uma-chave-segura"
PORT=3333
NODE_ENV=development
```

### Frontend (`frontend/.env`)

Copie a partir de `.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Exemplo:

```env
VITE_API_URL=http://localhost:3333/api
```

## 7. Instalação

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd ../frontend
npm install
```

## 8. Execução local

Em terminais separados:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Acesse:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:3333>
- API docs: <http://localhost:3333/api-docs>

## 9. Usuários de teste

Ambiente de demonstração:

- **ADM:** `admin@comprovos.com` / `123456`
- **TÉCNICO:** `tecnico@comprovos.com` / `123456`

## 10. Testes e qualidade

### Scripts úteis

No backend:

```bash
npm run test:run
npm run test:coverage
npm run build
```

No frontend:

```bash
npm run test:run
npm run test:coverage
npm run build
```

### Pipeline

- CI/CD configurado em `.github/workflows/ci.yml`
- Trabalho com jobs de backend, frontend e deploy
- Evidência principal: <https://github.com/guimaraesander/comprovos/actions/workflows/ci.yml>

## 11. Deploy

- Frontend (Vercel): <https://comprovos.vercel.app>
- Backend (Render): <https://comprovos-backend.onrender.com>
- Swagger: <https://comprovos-backend.onrender.com/api-docs>
- Health check: <https://comprovos-backend.onrender.com/health>

## 12. Documentação e evidências

- Relatório técnico: `docs/relatorio-tecnico.md`
- Diagrama: `docs/arquitetura-diagrama.md`
- Lista de requisitos: `docs/checklist-requisitos.md`
- Checklist de entrega: `docs/Checklist de Entrega.md`
- Evidência de vídeo: `docs/video-demonstracao.md`
- GitHub Projects / Kanban: <https://github.com/users/guimaraesander/projects/1/views/1>

## 13. Colaboração

A organização do trabalho foi registrada no GitHub por meio de **Issues** e de um **quadro Kanban no GitHub Projects**.

Fluxo adotado no repositório:
- `main` concentra a versão estável final do projeto.
- Desenvolvimento realizado em **branches por funcionalidade**.
- Integração das alterações por meio de merges e pull requests.
- Uso de **commits semânticos** para facilitar rastreabilidade.
- Registro das tarefas e entregas em **Issues** vinculadas ao board Kanban.

Estrutura do board:
- **Todo**
- **In Progress**
- **Done**

No Kanban foram organizadas as principais frentes do projeto, como:
- frontend
- backend
- autenticação
- banco de dados
- documentação da API
- testes automatizados
- deploy em nuvem
- ajustes finais de documentação e entrega

### Links de evidência
- **Repositório:** <https://github.com/guimaraesander/comprovos>
- **Kanban / GitHub Projects:** <https://github.com/users/guimaraesander/projects/1/views/1>

## 14. Observações

- Nunca versionar arquivos `.env` reais.
- Mantenha variáveis de ambiente explícitas no ambiente de execução.
- Atualize as evidências finais do projeto antes da entrega acadêmica.
- Caso o board Kanban permaneça privado, anexar também print atualizado no relatório técnico.

## 15. Licença

Uso acadêmico.