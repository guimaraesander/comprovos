# Relatório Técnico: Sistema ComprovOS

## Sumário

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Diagrama de Arquitetura em Nuvem](#2-diagrama-de-arquitetura-em-nuvem)
3. [Tecnologias e Serviços Utilizados](#3-tecnologias-e-serviços-utilizados)
4. [Estratégia de Deploy e CI/CD](#4-estratégia-de-deploy-e-cicd)
5. [Papéis e Contribuições da Equipe](#5-papéis-e-contribuições-da-equipe)
   - 5.1 [Evidência de Organização do Trabalho](#51-evidência-de-organização-do-trabalho)
   - 5.2 [Links de Validação](#52-links-de-validação)
   - 5.3 [Evidências Técnicas](#53-evidências-técnicas)
6. [Dificuldades Encontradas e Soluções Adotadas](#6-dificuldades-encontradas-e-soluções-adotadas)

---

## 1. Visão Geral do Sistema

O presente relatório descreve as especificações técnicas, a arquitetura e a organização do projeto *ComprovOS*, um sistema estruturado para a gestão de ordens de serviço e clientes de assistência técnica.

O ComprovOS é uma aplicação completa composta por *frontend*, *backend* e um *banco de dados relacional*. O sistema foi projetado para controlar fluxos operacionais que incluem autenticação de usuários via login, dashboards interativos, gestão de clientes e controle de ordens de serviço. A interface é acessível pelo navegador e a comunicação com o servidor é realizada por meio de uma API documentada via Swagger.

---

## 2. Diagrama de Arquitetura em Nuvem

A arquitetura do sistema foi distribuída para separar responsabilidades entre cada camada da aplicação:

| Camada | Serviço | Descrição |
|---|---|---|
| *Frontend* | Vercel | Hospedagem de aplicações estáticas e frameworks modernos |
| *Backend* | Render | Hospedagem com suporte a ambientes Node.js |
| *Banco de Dados* | PostgreSQL (Supabase) | SGBD relacional com persistência robusta de dados |
| *Documentação da API* | Swagger (/api-docs) | Centralização da documentação para integração entre camadas |

O diagrama abaixo representa a comunicação entre os serviços em nuvem e o fluxo de entrega contínua adotado no projeto:

```mermaid
flowchart LR
    U[Usuário / Equipe interna]
    F[Frontend<br/>React + Vite<br/>Vercel]
    B[Backend<br/>Node.js + Express<br/>Render + Docker]
    D[(PostgreSQL<br/>Supabase)]
    A[Swagger / API Docs]
    C[GitHub Actions<br/>CI/CD]
    G[GitHub Repository]

    U --> F
    F -->|HTTPS /api| B
    B --> D
    B --> A
    G --> C
    C -->|build, testes e deploy| F
    C -->|build, testes e deploy| B
```

---

## 3. Tecnologias e Serviços Utilizados

### Ambiente de Desenvolvimento

- *Runtime:* Node.js 22 LTS
- *Gerenciador de pacotes:* npm
- *Controle de versão:* Git e GitHub
- *IDE:* VS Code com extensões: Prisma, ESLint, Prettier, Thunder Client, DotENV e GitLens

### Stack Técnica

| Camada | Tecnologias |
|---|---|
| *Frontend* | React, Vite, TypeScript, Tailwind CSS |
| *Backend* | Express, Prisma, JWT, Vitest, Supertest |
| *Banco de Dados* | PostgreSQL com Prisma ORM |
| *Documentação* | Swagger / OpenAPI |
| *CI/CD* | GitHub Actions |
| *Infraestrutura* | Docker, Render, Vercel, Supabase |

---

## 4. Estratégia de Deploy e CI/CD

### Fluxo de Branches


feature/nome-da-branch  →  main-teste  →  main
   (desenvolvimento)       (integração)   (produção)


- *main* — branch final de produção
- *main-teste* — branch intermediária para integração e validação de funcionalidades
- *feature/nome-da-branch* — branches individuais de desenvolvimento; alterações enviadas via Pull Request para main-teste

### Pipeline de CI/CD (GitHub Actions)

O GitHub Actions automatiza as seguintes etapas:

1. Instalação de dependências
2. Execução dos comandos install e build (frontend e backend)
3. Geração do cliente Prisma
4. Execução dos testes automatizados

> O deploy automático ocorre *apenas quando o pipeline está sem falhas*.

### Segurança e Boas Práticas

- Uso de *variáveis de ambiente* para credenciais e configurações sensíveis
- *GitHub Secrets* para proteção de credenciais na pipeline
- Proteção de rotas autenticadas com *JWT*
- Controle de acesso por perfis (*RBAC*)
- Separação entre ambientes de *desenvolvimento* e *produção*
- Tratamento adequado de erros em todas as camadas

---

## 5. Papéis e Contribuições da Equipe

### João Lino — Deploy & Arquitetura em Nuvem

> Responsável pela publicação em produção e configuração de URLs e variáveis de ambiente.

Realizou o deploy oficial do ComprovOS utilizando serviços gerenciados: *Vercel* (Frontend), *Render* (Backend em containers) e *Supabase* (PostgreSQL). Configurou as variáveis de ambiente diretamente nos painéis das plataformas e apontou a API do frontend para o ambiente de produção.

*Principais desafios:* ajuste do estágio de build no Render, incluindo comandos de instalação, geração do cliente Prisma e resolução de conflitos no package-lock.json. Entrega consolidada no *PR #4* (branch main-teste).

---

### Anderson Guimarães — DevOps & CI/CD

> Responsável pela criação e manutenção dos fluxos automatizados no GitHub Actions.

Estruturou a pipeline de CI/CD via GitHub Actions (ci.yml), automatizando instalação, build e testes do frontend e backend. Configurou os *GitHub Secrets* e ajustou a geração do cliente Prisma para compatibilidade com o schema do banco. O fluxo foi integrado ao deploy automático da Vercel e Render.

*Entrega:* pipeline aprovada ("verde") na branch main-teste.

---

### Anderson Ferreira — Backend & QA

> Focado na criação de testes para a API, implementação de logs de acesso e erros.

Implementou uma suíte de *testes de integração* com Vitest e Supertest, cobrindo rotas de integridade (/health), autenticação JWT e segurança da API. Estruturou testes autossuficientes para o CRUD de Ordens de Serviço com criação dinâmica de dependências (como clientes) antes das validações. Reforçou a resiliência com *logs de erro* para falhas de conexão com o Supabase.

*Entrega:* *PR #6* (branch main-teste).

---

### Atila Gois — Frontend & UX/UI

> Responsável pelos testes de interface, correção de bugs visuais e melhoria na experiência do usuário.

Implementou a interface do ComprovOS utilizando *Vitest* e *React Testing Library* para validar fluxos críticos de login e navegação protegida via JWT. Desenvolveu estados de loading e mensagens de erro dinâmicas, refinou a responsividade do Dashboard com *Tailwind CSS* e garantiu a consistência via gestão de estados globais e armazenamento seguro de tokens.

*Entrega:* branch feature/frontend-tests-interface.

---

### Luan Cândido — Segurança & RBAC

> Implementação de autorização por perfis de acesso e proteção de rotas.

Implementou e validou o *controle de acesso baseado em perfis (RBAC)* em todas as camadas do sistema. Refinou os middlewares de autenticação e autorização (auth.ts e role.ts) no backend para proteger endpoints críticos, garantindo respostas HTTP adequadas para acessos não autorizados ou tokens JWT inválidos. Revisou o componente ProtectedRoute no frontend para bloqueio de páginas restritas e redirecionamento correto.

*Entrega:* branch feature/autorizacao-perfis-seguranca.

---

### Larissa Fernandes — Gestão & Documentação

> Organização do Kanban (GitHub Issues), elaboração deste relatório e produção de evidências de funcionamento.

Organizou o fluxo de trabalho via *GitHub Issues* e *Kanban*, garantindo visibilidade e rastreabilidade ao progresso da equipe. Consolidou as contribuições técnicas neste relatório e produziu o roteiro e o *vídeo de demonstração* do ComprovOS em produção, reunindo evidências visuais de deploy (Vercel/Render) e da pipeline de CI/CD.

*Entrega:* branch feature/relatorio-video-kanban.

---

### 5.1 Evidência de Organização do Trabalho

O projeto utilizou *GitHub Issues* e *GitHub Projects (Kanban)* para registrar a organização das atividades. O quadro foi estruturado com as colunas:

- *Todo* — tarefas pendentes
- *In Progress* — tarefas em andamento
- *Done* — tarefas concluídas

As principais entregas (frontend, backend, autenticação, persistência, documentação da API, testes, deploy e ajustes finais) foram distribuídas no board. Como a maior parte do desenvolvimento técnico já estava concluída no momento da consolidação acadêmica, as entregas implementadas foram posicionadas em *Done*, mantendo em andamento apenas os ajustes finais.

### 5.2 Links de Validação

| Recurso | Link |
|---|---|
| *Repositório* | https://github.com/guimaraesander/comprovos |
| *GitHub Projects (Kanban)* | https://github.com/users/guimaraesander/projects/1/views/1 |

### 5.3 Evidências Técnicas

| Recurso | Link / Caminho |
|---|---|
| *Workflow CI/CD* | .github/workflows/ci.yml |
| *Deploy e validação* | https://github.com/guimaraesander/comprovos/actions/workflows/ci.yml |
| *Backend em produção* | https://comprovos-backend.onrender.com |
| *Frontend em produção* | https://comprovos.vercel.app |
| *Documentação da API* | https://comprovos-backend.onrender.com/api-docs |
| *Health check* | https://comprovos-backend.onrender.com/health |
| *Board Kanban* | https://github.com/users/guimaraesander/projects/1/views/1 |

---

## 6. Dificuldades Encontradas e Soluções Adotadas

Durante o desenvolvimento foram identificados riscos técnicos e estabelecidos protocolos preventivos:

### Vazamento de Credenciais
*Problema:* risco de exposição de chaves sensíveis no repositório.  
*Solução:* proibição de envio de arquivos .env ao GitHub via .gitignore; compartilhamento seguro via canais internos da equipe.

### Conflitos de Código
*Problema:* com múltiplos integrantes, o risco de conflitos em branches era alto.  
*Solução:* obrigatoriedade de atualizar a branch pessoal com a main-teste antes de abrir qualquer Pull Request.

### Padronização de Histórico
*Problema:* commits genéricos dificultavam o rastreio de alterações.  
*Solução:* implementação do padrão *Conventional Commits* (ex: feat:, fix:, test:).

### Quebra de Funcionalidades
*Problema:* novas atualizações podiam afetar o sistema existente.  
*Solução:* regra de validar login e dashboard antes de cada integração final.

### Integração Frontend ↔ Backend em Ambientes Distintos
*Problema:* inconsistência nas variáveis de ambiente entre frontend e backend.  
*Solução:* centralização da configuração por ambiente e validação das variáveis críticas (URL da API, credenciais do banco, autenticação) antes da publicação.

### Geração do Prisma Client e Compatibilidade do Build
*Problema:* falhas na geração do Prisma Client durante deploy e pipeline de CI.  
*Solução:* etapas de instalação, build, geração do cliente Prisma e testes explicitadas no fluxo automatizado, com scripts do projeto alinhados.

---
