# Produção

1. Defina `SPRING_PROFILES_ACTIVE=prod` e `DEMO_SEED=false`.
2. Use segredo JWT aleatório e forte em secret manager; não utilize o default de desenvolvimento.
3. Use TLS na borda/reverse proxy.
4. Restrinja `CORS_ALLOWED_ORIGINS` ao domínio oficial.
5. Execute migrations Flyway antes ou durante o rollout controlado.
6. Faça backup e monitore PostgreSQL, `/actuator/health` e logs estruturados.
7. Use usuário de banco com privilégios mínimos compatíveis com migrations e runtime.
