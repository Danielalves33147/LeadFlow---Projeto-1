# Ajustes para o padrão de organização acadêmico

Esta versão preserva as funcionalidades do LeadFlow e reorganiza o backend para deixar explícitos os pacotes exigidos:

- `controller`: endpoints e entrada HTTP;
- `dao`: persistência e consultas;
- `model`: entidades e enums de domínio;
- `utils`: utilitários compartilhados.

Também permanecem as camadas complementares `service`, `dto`, `config`, `security`, `exception`, `specification` e `validation`.

## Alterações técnicas

1. `br.com.leadflow.util` foi renomeado para `br.com.leadflow.utils`.
2. Todos os imports de `TextUtils` foram atualizados, inclusive os testes.
3. Foram incluídos `package-info.java` em `controller`, `dao`, `model` e `utils` documentando a responsabilidade de cada pacote.
4. A integração do Flyway foi mantida com `spring-boot-starter-flyway`, necessária para executar as migrations no Spring Boot 4.1.
5. O frontend mantém Vite 8.1.0 com `@vitejs/plugin-react` 6.0.4, evitando o conflito de dependências encontrado na instalação.

Nenhuma entidade, endpoint, regra de negócio ou migration foi removida por esta reorganização.
