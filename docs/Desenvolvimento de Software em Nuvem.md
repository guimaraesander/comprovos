1. Nível de Conhecimento Esperado
Ao iniciar esta atividade, espera-se que os alunos dominem:
● Fundamentos de computação em nuvem (IaaS, PaaS, SaaS);
● Arquitetura cliente-servidor e APIs REST;
● Controle de versão com Git e GitHub;
● Conceitos básicos de containers e virtualização;
● Noções de segurança em aplicações web;
● Experiência prévia com desenvolvimento web.

2. Objetivo da Atividade
Projetar, implementar e implantar uma aplicação web escalável baseada em nuvem, utilizando arquitetura em camadas, serviços gerenciados, containers e práticas de DevOps, com foco em qualidade, segurança e observabilidade.

4. Escopo do Projeto
4.1 Aplicação Web
Desenvolver um sistema web com caso de uso mais elaborado, como:
● Sistema de reservas com múltiplos perfis (usuário/admin);
● Plataforma de gerenciamento de projetos;
● Sistema de pedidos com status e histórico;
● Catálogo inteligente com filtros avançados.

4.2 Requisitos Funcionais
● Autenticação e autorização
● API RESTful documentada (Swagger/OpenAPI);
● Operações CRUD completas;
● Validação de dados no back-end;
● Registro de logs de acesso e erro.

4.3 Arquitetura Técnica Obrigatória
● Front-end:
○ Framework moderno (React, Vue ou Angular);
○ Deploy em serviço de nuvem (Netlify, Vercel ou similar).
● Back-end:
○ API REST em ambiente containerizado (Docker);
○ Deploy em serviço de nuvem (Render, Railway, AWS, Azure ou GCP).
● Banco de Dados:
○ Serviço gerenciado em nuvem (Firebase, Supabase, MongoDB Atlas, RDS);
○ Persistência fora do container.

5. DevOps e Nuvem (Obrigatório)
● Uso de Docker para empacotamento do back-end;
● Pipeline simples de CI/CD (GitHub Actions ou similar) contendo:
○ Build;
○ Execução de testes automatizados;
○ Deploy automático.

6. Segurança e Boas Práticas
● Uso de variáveis de ambiente para credenciais;
● Proteção de rotas autenticadas;
● Tratamento adequado de erros;
● Separação entre ambientes (dev / prod, quando possível).

7. Testes e Qualidade ( Opcional)
● Implementar testes automatizados obrigatórios:
○ Back-end: testes de API (Postman, Jest, Pytest ou similar);
○ Front-end: pelo menos um teste de componente ou fluxo.
● Relatório simples de cobertura ou evidência de execução.

8. Ferramentas Colaborativas
● Repositório público no GitHub;
● Uso de branches por funcionalidade;
● Commits semânticos e frequentes;
● Issues Kanban (GitHub Projects) para organização do trabalho.

9. Entregáveis
9.1 Código-Fonte
● Repositório público no GitHub contendo:
○ Código organizado;
○ Dockerfile;
○ Arquivos de configuração;
○ README detalhado.

9.2 Relatório Técnico (máx. 6 páginas)
Deve conter:
● Visão geral do sistema;
● Diagrama de arquitetura em nuvem;
● Tecnologias e serviços utilizados;
● Estratégia de deploy e CI/CD;
● Papéis e contribuições da equipe;
● Dificuldades encontradas e soluções adotadas.

9.3 Demonstração em Vídeo
● Vídeo de até 7 minutos mostrando:
○ Arquitetura;
○ Funcionamento do sistema;
○ Deploy em nuvem;
○ Pipeline ou testes automatizados.

10. Critérios de Avaliação
● Complexidade e correção funcional do sistema;
● Qualidade da arquitetura em nuvem;
● Uso adequado de serviços e containers;
● Segurança e boas práticas;
● Automação (testes e deploy);
● Organização, documentação e colaboração.

11. Diferencial (Bônus)
● Uso de cache (Redis, Cloudflare);
● Monitoramento básico (logs ou métricas);
● Feature flag ou configuração dinâmica;
● Integração com serviço externo (API pública).