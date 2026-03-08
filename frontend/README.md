# ComprovOS — Frontend

Frontend web do ComprovOS (painel interno), feito com **React + Vite + TypeScript**.

---

## Requisitos

- Node.js (LTS)
- npm

---

## Como rodar pela primeira vez

1) Instalar dependências:

cd frontend
npm install

2) Criar o arquivo `.env` (local) em `frontend/.env`:

VITE_API_URL=http://localhost:3333/api

3) Rodar o projeto:

npm run dev

Acesse:
- http://localhost:5173

---

## Scripts

Dentro de `frontend/`:

- npm run dev — roda em desenvolvimento
- npm run build — build de produção (valida TypeScript)
- npm run preview — preview do build

---

## Padrão de UI (OBRIGATÓRIO)

Para evitar páginas “quebradas” (classes faltando), todas as telas devem usar **somente** as classes padrão já existentes no arquivo:

- frontend/src/styles.css

### Classes padrão permitidas

Layout de página:
- page-header
- page-title
- page-subtitle
- page-actions
- card

Botões:
- btn
- btn-primary
- btn-secondary
- btn-danger
- btn-ghost

Tabela:
- table-wrap
- table

Modal:
- modal-backdrop
- modal
- modal-header
- modal-body
- modal-footer
- modal-title
- icon-btn

Form:
- form-grid
- field
- field-full

Alertas e texto:
- alert-error
- muted

Regra de ouro:
Não criar className novo em páginas sem antes adicionar o estilo no frontend/src/styles.css.

---

## Template oficial de nova página

Para criar uma página nova, copie:
- frontend/src/pages/_templates/PageTemplate.tsx

Esse template já vem com:
- header padrão
- botões padrão
- card + tabela padrão
- modal + form padrão

Assim, novas páginas não quebram o CSS.

---

## Checklist antes de commit

1) Rodar build do frontend:

cd frontend
npm run build

2) Testar a página no navegador (rotas relevantes)

3) Só então fazer commit e push