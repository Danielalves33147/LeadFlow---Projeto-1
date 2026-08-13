# Modelo de dados

Entidades principais: `Company`, `Branch`, `User`, `UserBranch`, `Lead`, `Interaction`, `Task`, `ScoreRule`, `LeadHistory`, `Notification` e `RefreshToken`.

Regras estruturais:

- Company 1:N Branch.
- Company 1:N User.
- Lead N:1 Branch e sua filial não é alterada por reatribuição.
- Lead N:1 User como responsável atual.
- Lead 1:N Interaction, Task e LeadHistory.
- Gerentes podem ter N filiais através de UserBranch.
- Histórico é append-only na aplicação.
- Uma regra ativa por empresa/tipo de interação é garantida por índice parcial PostgreSQL.

Índices estão definidos para filtros de Lead, responsável, filial, etapa, datas, tarefas, interações e notificações.
