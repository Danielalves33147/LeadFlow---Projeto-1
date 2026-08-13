# Banco de dados LeadFlow

A estrutura do PostgreSQL é versionada exclusivamente pelo Flyway em `backend/src/main/resources/db/migration`.
Não edite o schema manualmente em ambientes compartilhados. Novas alterações devem ser criadas em migrations incrementais `V<N>__descricao.sql`.
