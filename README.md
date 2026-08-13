# LeadFlow

CRM B2B responsivo para gestão de empresas, filiais, equipes, Leads e desempenho comercial.

O repositório contém uma implementação full stack com **frontend React/TypeScript** e **backend Java/Spring Boot** organizado nas camadas solicitadas `Controller`, `DAO`, `Model` e `Utils`, complementadas por `Service`, `DTO`, `Security`, `Specification`, validações e tratamento global de erros.

## Arquitetura

```text
Browser
  │
  ▼
React + TypeScript + Vite
  │ REST / JSON / JWT
  ▼
Java 21 + Spring Boot
  │
  ├── Controller  → contrato HTTP
  ├── Service     → regra de negócio/transação/autorização
  ├── DAO         → acesso/persistência com Spring Data JPA
  ├── Model       → entidades JPA
  └── Utils       → funções utilitárias reutilizáveis
          │
          ▼
      PostgreSQL
```

## Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- CSS responsivo baseado nos tokens do Design System anexado
- API client com access token, refresh automático e tratamento padronizado de erros
- Gráficos SVG/CSS leves, Kanban responsivo, tabelas e formulários reutilizáveis

### Backend
- Java 21
- Spring Boot 4.1
- Spring Web MVC
- Spring Data JPA
- Spring Security
- Bean Validation
- PostgreSQL
- Flyway
- JWT HMAC-SHA256 + refresh tokens persistidos como hash
- BCrypt
- SpringDoc OpenAPI
- JUnit 5 / MockMvc / Testcontainers configurados

## Estrutura

A organização do backend segue explicitamente o padrão acadêmico solicitado, mantendo como pacotes principais **`controller`**, **`dao`**, **`model`** e **`utils`**. As demais pastas complementam a arquitetura sem substituir essas quatro camadas.

```text
leadflow/
├── frontend/                  # SPA React/TypeScript
├── backend/                   # API Java/Spring Boot
│   └── src/main/java/br/com/leadflow/
│       ├── controller/              # obrigatório: entrada HTTP
│       ├── dao/                     # obrigatório: acesso a dados
│       ├── model/                   # obrigatório: entidades
│       ├── utils/                   # obrigatório: utilitários
│       ├── service/
│       ├── dto/
│       ├── security/
│       ├── config/
│       ├── exception/
│       ├── specification/
│       └── validation/
├── database/                  # notas sobre o schema
├── docs/                      # arquitetura, API, permissões e Design System
├── docker-compose.yml
└── .env.example
```

## Telas implementadas

1. Login
2. Cadastro
3. Dashboard — Visão Geral
4. Lista de Leads
5. Funil de Vendas
6. Detalhes do Lead
7. Interações
8. Tarefas — Lista e Calendário
9. Filiais
10. Detalhes da Filial
11. Equipe
12. Regras de Pontuação
13. Ranking de Filiais
14. Configurações

## Perfis

- **Administrador**: visão ampla da empresa, filiais, usuários, regras e configurações.
- **Gerente**: escopo limitado às filiais autorizadas e equipe vinculada.
- **Vendedor**: próprios Leads, interações, tarefas e desempenho.

As permissões são validadas no backend; o frontend apenas reflete visualmente o que é permitido.

## Executar com Docker

Pré-requisito: Docker com Compose.

```bash
cp .env.example .env
docker compose up --build
```

Acessos:

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`

## Executar sem Docker

### PostgreSQL

Crie um banco `leadflow` e usuário com as credenciais configuradas em `application.yml` ou variáveis de ambiente. O Flyway criará o schema automaticamente.

### Backend

Requer Java 21 e Maven.

```bash
cd backend
mvn clean test
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Frontend

Requer Node.js 22+.

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Contas de demonstração

Com `DEMO_SEED=true` e banco vazio:

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | administrador@leadflow.com.br | LeadFlow123! |
| Gerente | gerente@leadflow.com.br | LeadFlow123! |
| Vendedor | vendedor@leadflow.com.br | LeadFlow123! |

A senha é conhecida somente para o ambiente demo; no banco é armazenada por BCrypt.

## Variáveis principais

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadflow
DB_USERNAME=leadflow
DB_PASSWORD=change-me
JWT_SECRET=replace-with-a-long-random-secret-of-at-least-32-characters
JWT_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8081
DEMO_SEED=true
SPRING_PROFILES_ACTIVE=dev
```

Frontend:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Banco e migrations

As migrations estão em:

`backend/src/main/resources/db/migration`

Elas criam empresas, filiais, usuários, autorizações por filial, Leads, regras de pontuação, interações, tarefas, histórico, notificações e refresh tokens, incluindo chaves estrangeiras e índices de consulta.

## Segurança

- senha nunca é armazenada em texto puro;
- JWT de curta duração;
- refresh token rotacionado e armazenado somente por hash SHA-256;
- autenticação stateless;
- validação multiempresa e por filial no Service;
- vendedor não consegue consultar registro de outro vendedor;
- respostas de erro não expõem stack trace;
- CORS é configurável por ambiente;
- `DEMO_SEED` é desabilitado no perfil `prod`.

Antes de produção, substitua o segredo JWT, configure TLS, restrinja CORS e utilize um gerenciador de segredos.

## Qualidade

Backend:

```bash
mvn clean test
```

Frontend:

```bash
npm run typecheck
npm run build
```

## Design System

O arquivo de referência foi incluído em `docs/LeadFlow_Design_System_UI_UX.pdf`. O frontend utiliza seus princípios de paleta, hierarquia, densidade, cards, tabelas, responsividade, acessibilidade e navegação.

## Verificação completa

Em Linux/macOS, a sequência de testes e builds pode ser executada por:

```bash
./scripts/verify.sh
```

Consulte `docs/validation.md` para o checklist de smoke tests e validação antes de produção.
