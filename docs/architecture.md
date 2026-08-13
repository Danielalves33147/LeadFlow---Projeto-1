# Arquitetura LeadFlow

O LeadFlow adota um monólito modular com frontend e backend desacoplados por API REST.

```text
React + TypeScript
       │ HTTPS / JSON
       ▼
Spring REST Controller
       ▼
Service (regras, transações e autorização contextual)
       ▼
DAO (Spring Data JPA)
       ▼
PostgreSQL
```

## Backend

A estrutura principal respeita `Controller`, `Model` e `DAO` e adiciona `Service`, `DTO`, `Security`, `Exception`, `Specification` e `Validation` para evitar regra de negócio em controllers e entidades expostas diretamente na API.

## Multiempresa

Todas as entidades comerciais são contextualizadas pela empresa do usuário autenticado. Gerentes operam nas filiais autorizadas; vendedores operam nos próprios Leads. O frontend oculta ações proibidas, mas a validação definitiva ocorre no backend.

## Segurança

- Spring Security stateless.
- Access token JWT de curta duração.
- Refresh token aleatório armazenado no banco somente como SHA-256.
- Senhas BCrypt.
- CORS configurável.
- DTOs de entrada validados com Bean Validation.
- Exceções padronizadas sem stack trace na resposta.
