# ComprovOS

Sistema web para assistência técnica de computadores, substituindo o comprovante em papel por um fluxo digital com cadastro de clientes, equipamentos, ordens de serviço, autenticação, acompanhamento de status e execução em nuvem.

## Objetivo do projeto

O **ComprovOS** foi desenvolvido como trabalho da disciplina de **Desenvolvimento de Software em Nuvem**, com foco em:

- front-end web
- API REST
- autenticação e autorização
- banco de dados em nuvem
- documentação técnica
- práticas de CI/CD
- organização colaborativa com Git e GitHub

## Stack utilizada

### Front-end
- React
- Vite
- TypeScript

### Back-end
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- Swagger / OpenAPI

### Banco de dados
- PostgreSQL
- Supabase

### Ferramentas
- Git / GitHub
- GitHub Actions
- VS Code
- Thunder Client
- Docker (backend)

## Estrutura do projeto

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
│  ├─ .env
│  ├─ package.json
│  └─ vite.config.ts
├─ docs/
├─ .env.example
├─ package.json
└─ README.md
```

## Funcionalidades principais

- login com autenticação JWT
- rotas protegidas no front-end
- API REST com documentação Swagger
- dashboard interno
- cadastro e gerenciamento de clientes
- cadastro e acompanhamento de ordens de serviço
- seed inicial com usuário de teste
- integração com banco PostgreSQL em nuvem

## Requisitos para rodar localmente

Instale no computador:

- Git
- Node.js 22 LTS
- npm
- VS Code
- PostgreSQL
- navegador atualizado

Também é recomendado instalar no VS Code:

- Prisma
- ESLint
- Prettier - Code formatter
- Thunder Client
- DotENV
- GitLens

## Clonando o projeto

```bash
git clone https://github.com/guimaraesander/comprovos.git
cd comprovos
code .
```

## Variáveis de ambiente

### Backend: `backend/.env`

Use um arquivo nesse formato:

```env
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@SEU_HOST:5432/postgres"
JWT_SECRET="troque-por-uma-chave-segura"
PORT=3333
NODE_ENV=development
```

### Front-end: `frontend/.env`

```env
VITE_API_URL=http://localhost:3333/api
```

## Instalação das dependências

### Backend
```bash
cd backend
npm install
```

### Front-end
```bash
cd ../frontend
npm install
```

## Executando o projeto

### 1. Subir o back-end
```bash
cd backend
npm run dev
```

### 2. Subir o front-end
Em outro terminal:
```bash
cd frontend
npm run dev
```

## Endereços locais

- Front-end: `http://localhost:5173`
- Back-end: `http://localhost:3333`
- Swagger: `http://localhost:3333/api-docs`

## Usuário de teste

Ambiente de desenvolvimento:

- **Email:** `admin@comprovos.com`
- **Senha:** `123456`

## Scripts principais

### Backend
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:push
npm run seed
```

### Front-end
```bash
npm run dev
npm run build
npm run preview
npm run test
```

## Fluxo de branches da equipe

A equipe vai trabalhar com uma branch intermediária de integração chamada:

- `main-teste`

Fluxo combinado:

1. `main` fica reservada para a versão final.
2. Cada integrante cria sua branch a partir de `main-teste`.
3. Cada tarefa é enviada primeiro para `main-teste`.
4. Após validação geral, o conteúdo consolidado vai para `main`.

Exemplo:

```bash
git checkout main
git pull origin main
git checkout -b main-teste
git push -u origin main-teste
```

Exemplo de branch de integrante:

```bash
git checkout main-teste
git pull origin main-teste
git checkout -b feature/nome-da-tarefa
git push -u origin feature/nome-da-tarefa
```

## Itens acadêmicos da proposta

O projeto foi planejado para atender aos pontos da disciplina:

- aplicação web com front-end e API
- autenticação e autorização
- documentação de API
- banco de dados em nuvem
- Docker
- CI/CD
- deploy em nuvem
- documentação técnica
- colaboração via GitHub

## O que ainda deve ser concluído pela equipe

As tarefas restantes foram separadas em 6 frentes e estão detalhadas no arquivo:

- `PLANO_BRANCHES_EQUIPE.md`

Também foi criado um guia completo de instalação e fluxo de trabalho para os integrantes:

- `GUIA_EQUIPE_INSTALACAO_E_FLUXO.md`

## Observações importantes

- nunca subir arquivos `.env` com credenciais reais para o GitHub
- sempre atualizar a branch-base antes de começar uma tarefa
- sempre testar localmente antes de enviar para `main-teste`
- a `main` só deve receber código revisado e validado

## Autores / Equipe

Preencher com os nomes completos dos integrantes da equipe.

## Licença

Uso acadêmico.
