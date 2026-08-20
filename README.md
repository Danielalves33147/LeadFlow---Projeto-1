# LeadFlow

CRM B2B full stack para gestão de **Leads, filiais, equipes, interações, tarefas e desempenho comercial**.

O LeadFlow foi desenvolvido como projeto acadêmico de **Projeto Integrador**, aplicando conceitos de desenvolvimento web, APIs REST, segurança, banco de dados relacional, controle de acesso por perfil e organização em camadas.

---

## Visão geral

O sistema permite que empresas organizem o fluxo comercial desde a entrada de um Lead até sua conversão, distribuindo responsabilidades entre administradores, gerentes e vendedores.

Entre os principais recursos estão:

- cadastro e autenticação de usuários;
- confirmação de e-mail;
- recuperação de senha por código;
- gestão de Leads;
- funil de vendas;
- registro de interações comerciais;
- sistema de pontuação de Leads;
- tarefas em lista e calendário;
- gestão de equipe;
- gestão de filiais;
- dashboard com indicadores;
- ranking de filiais e vendedores;
- configurações de conta e empresa;
- controle de acesso baseado em perfil;
- persistência em PostgreSQL/Supabase;
- migrations gerenciadas com Flyway.

---

## Funcionalidades

### Autenticação e conta

O sistema possui fluxo completo de autenticação:

- cadastro de usuário;
- login;
- confirmação de e-mail;
- ativação de conta;
- access token e refresh token;
- logout;
- atualização de perfil;
- alteração de senha;
- recuperação de senha através de código de 6 dígitos enviado por e-mail.

As senhas são armazenadas utilizando **BCrypt**.

Os refresh tokens são persistidos de forma protegida utilizando hash.

---

### Perfis de acesso

O LeadFlow possui três perfis principais:

| Perfil | Permissões principais |
|---|---|
| **Administrador** | Acesso amplo à empresa, equipe, filiais, ranking, regras de pontuação e configurações |
| **Gerente** | Gestão e acompanhamento das filiais e usuários aos quais possui acesso |
| **Vendedor** | Gestão dos próprios Leads, interações e tarefas |

O vendedor é direcionado diretamente para a área de **Leads** após o login e não possui acesso ao dashboard administrativo.

As permissões importantes são validadas também no backend.

---

## Gestão de Leads

O módulo de Leads permite:

- cadastrar Leads;
- editar informações;
- definir responsável;
- associar Lead a uma filial;
- alterar estágio;
- consultar detalhes;
- visualizar histórico;
- pesquisar e filtrar registros;
- acompanhar última interação;
- utilizar visualização em tabela;
- acompanhar o Lead pelo funil comercial.

### Estágios

O fluxo comercial utiliza estágios como:

- Novo;
- Contatado;
- Negociação;
- Cliente;
- Perdido.

---

## Funil de vendas

O sistema possui uma visualização em formato de funil/Kanban para acompanhar os Leads conforme avançam pelo processo comercial.

Essa visualização facilita a identificação de:

- Leads recém-cadastrados;
- Leads em contato;
- negociações em andamento;
- conversões;
- oportunidades perdidas.

---

## Interações

As interações representam contatos realizados com os Leads.

É possível registrar informações como:

- Lead;
- responsável;
- canal;
- tipo de interação;
- observações;
- pontuação aplicada;
- data da interação.

As interações podem alterar a pontuação do Lead de acordo com as regras configuradas pela empresa.

---

## Regras de pontuação

Administradores podem configurar regras de pontuação associadas aos tipos de interação.

As operações disponíveis permitem:

- adicionar pontos;
- subtrair pontos;
- definir uma pontuação.

As regras podem ser ativadas ou desativadas conforme a estratégia comercial.

---

## Tarefas

O módulo de tarefas possui duas formas de visualização:

### Lista

Permite:

- pesquisar tarefas pelo nome;
- filtrar por Lead;
- filtrar por responsável;
- filtrar por filial;
- filtrar por status;
- filtrar por data;
- criar tarefas;
- editar tarefas;
- concluir tarefas;
- cancelar tarefas;
- abrir um modal com todos os detalhes.

### Calendário

Permite visualizar as tarefas distribuídas por data e navegar entre os meses.

Também é possível selecionar uma data específica para facilitar a consulta.

---

## Dashboard e indicadores

Administradores e gerentes possuem acesso ao dashboard de desempenho.

Os indicadores respeitam o período selecionado pelo usuário.

Períodos disponíveis:

- 7 dias;
- 30 dias;
- 90 dias;
- 180 dias;
- 365 dias.

Para melhorar a leitura dos gráficos, os dados são agrupados de acordo com o tamanho do período:

| Período | Agrupamento |
|---|---|
| 7 dias | Diário |
| 30 dias | Semanal |
| 90 dias | Quinzenal |
| 180 dias | Mensal |
| 365 dias | Bimestral |

O período influencia KPIs, evolução, distribuições, rankings e demais indicadores dependentes de tempo.

---

## Ranking

O sistema permite acompanhar desempenho comercial através de rankings.

Entre os dados analisados estão:

- desempenho por filial;
- desempenho por vendedor;
- pontuação;
- conversões;
- evolução dentro do período selecionado.

---

## Configurações

A área de configurações permite gerenciar informações de conta e, de acordo com o perfil, informações da empresa.

Entre os dados disponíveis estão:

- nome;
- e-mail;
- dados de contato;
- telefone;
- site;
- CEP;
- endereço;
- número;
- complemento;
- bairro;
- cidade;
- estado;
- preferências do sistema;
- alteração de senha.

As opções administrativas são exibidas somente para os perfis autorizados.

---

# Arquitetura

O projeto utiliza uma arquitetura cliente-servidor.

```text
┌───────────────────────────────┐
│        React + TypeScript     │
│            Vite              │
└───────────────┬───────────────┘
                │
                │ REST / JSON / JWT
                ▼
┌───────────────────────────────┐
│       Spring Boot / Java      │
│                               │
│ Controller                    │
│ Service                       │
│ DAO                           │
│ DTO                           │
│ Model                         │
│ Security                      │
│ Specification                 │
│ Validation                    │
│ Utils                         │
└───────────────┬───────────────┘
                │
                │ JPA / JDBC
                ▼
┌───────────────────────────────┐
│      PostgreSQL / Supabase    │
│                               │
│           Flyway              │
└───────────────────────────────┘
```

---

# Tecnologias utilizadas

## Frontend

- React 19
- TypeScript 5
- Vite 8
- React Router
- HTML5
- CSS3
- Fetch/API Client
- JWT

## Backend

- Java 21
- Spring Boot 4.1
- Spring Web MVC
- Spring Data JPA
- Spring Security
- Spring Validation
- Spring Mail
- Spring Boot Actuator
- PostgreSQL Driver
- Flyway
- SpringDoc OpenAPI
- BCrypt
- JWT

## Testes

- JUnit 5
- Spring Security Test
- MockMvc
- H2
- Testcontainers

## Banco de dados

- PostgreSQL
- Supabase
- Flyway

---

# Estrutura do projeto

```text
LeadFlow/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/br/com/leadflow/
│   │   │   │   ├── config/
│   │   │   │   ├── controller/
│   │   │   │   ├── dao/
│   │   │   │   ├── dto/
│   │   │   │   ├── exception/
│   │   │   │   ├── model/
│   │   │   │   ├── security/
│   │   │   │   ├── service/
│   │   │   │   ├── specification/
│   │   │   │   ├── utils/
│   │   │   │   └── validation/
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── db/migration/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── application-prod.yml
│   │   │
│   │   └── test/
│   │
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── types/
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── database/
├── docs/
├── scripts/
├── .env.example
├── .gitignore
└── README.md
```

---

# Pré-requisitos

Antes de executar o projeto, instale:

- **Java 21**
- **Maven 3.9+**
- **Node.js 22+**
- **npm**
- acesso a um banco **PostgreSQL**

O banco pode ser hospedado localmente ou em um serviço PostgreSQL compatível, como o **Supabase**.

---

# Clonando o projeto

```bash
git clone https://github.com/Danielalves33147/LeadFlow---Projeto-1.git
cd LeadFlow---Projeto-1
```

---

# Configuração do backend

O backend utiliza variáveis de ambiente para conexão com banco, autenticação e envio de e-mails.

Crie um arquivo `.env` na raiz utilizada pelo backend ou configure as variáveis diretamente no sistema operacional.

Exemplo:

```env
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha

JWT_SECRET=troque-por-um-segredo-aleatorio-com-pelo-menos-32-caracteres
JWT_EXPIRATION=900
JWT_REFRESH_EXPIRATION=604800

CORS_ALLOWED_ORIGINS=http://localhost:5173

DEMO_SEED=false
SPRING_PROFILES_ACTIVE=dev

FRONTEND_URL=http://localhost:5173

EMAIL_VERIFICATION_EXPIRATION=86400
INVITATION_EXPIRATION=86400
```

> Nunca envie o arquivo `.env` real para o Git.

---

# Configuração de e-mail

O LeadFlow suporta dois modos.

## Console

Recomendado para desenvolvimento.

```env
EMAIL_MODE=console
```

Os códigos e mensagens são exibidos no terminal do backend.

## SMTP

Para envio real de e-mails:

```env
EMAIL_MODE=smtp

MAIL_HOST=smtp.seuprovedor.com
MAIL_PORT=587
MAIL_USERNAME=seu_email
MAIL_PASSWORD=sua_senha_de_aplicativo
EMAIL_FROM=seu_email
```

O SMTP é utilizado em funcionalidades como confirmação de conta, convites e recuperação de senha.

---

# Executando o backend

Abra um terminal:

```bash
cd backend
mvn clean spring-boot:run
```

Por padrão:

```text
http://localhost:8080
```

---

# Configuração do frontend

Dentro da pasta `frontend`, crie um arquivo `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

# Executando o frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite normalmente disponibilizará a aplicação em:

```text
http://localhost:5173
```

---

# Banco de dados e Flyway

As migrations ficam em:

```text
backend/src/main/resources/db/migration/
```

O Flyway executa automaticamente as migrations na inicialização do backend.

O projeto possui migrations versionadas para a criação da estrutura principal e uma migration repetível de compatibilidade:

```text
R__ensure_settings_and_password_change.sql
```

Essa migration garante estruturas relacionadas às configurações da empresa e ao processo de alteração/recuperação de senha, podendo ser executada de forma idempotente.

Para ambientes existentes, o Flyway preserva o histórico de migrations já aplicadas.

---

# Principais rotas do frontend

| Rota | Função |
|---|---|
| `/login` | Login |
| `/cadastro` | Cadastro |
| `/confirmar-email` | Confirmação de e-mail |
| `/ativar-conta` | Ativação de conta |
| `/esqueci-senha` | Recuperação de senha |
| `/dashboard` | Dashboard |
| `/leads` | Lista de Leads |
| `/leads/funil` | Funil |
| `/leads/:leadId` | Detalhes do Lead |
| `/interacoes` | Interações |
| `/tarefas` | Tarefas |
| `/equipe` | Equipe |
| `/pontuacao/regras` | Regras de pontuação |
| `/ranking-filiais` | Ranking |
| `/configuracoes` | Configurações |

As rotas são protegidas de acordo com a autenticação e o perfil do usuário.

---

# API e documentação

Com o backend em execução:

### Swagger UI

```text
http://localhost:8080/swagger-ui.html
```

### OpenAPI

```text
http://localhost:8080/v3/api-docs
```

### Health Check

```text
http://localhost:8080/actuator/health
```

---

# Testes e validação

## Backend

Executar testes:

```bash
cd backend
mvn clean test
```

Compilar:

```bash
mvn clean package
```

---

## Frontend

Verificação de tipos:

```bash
cd frontend
npm run typecheck
```

Build de produção:

```bash
npm run build
```

---

# Segurança

O projeto utiliza diferentes mecanismos de segurança:

- autenticação JWT;
- refresh tokens;
- BCrypt para senhas;
- Spring Security;
- rotas protegidas;
- controle de acesso baseado em perfil;
- validação de permissões no backend;
- tokens temporários;
- expiração de tokens;
- invalidação de sessões após recuperação de senha;
- configuração de CORS por ambiente;
- variáveis sensíveis através de ambiente.

Para produção, recomenda-se:

- utilizar HTTPS;
- utilizar segredos fortes;
- nunca versionar arquivos `.env`;
- utilizar senhas diferentes por ambiente;
- restringir CORS;
- utilizar um gerenciador de segredos;
- desativar dados de demonstração.

---

# Fluxo resumido

```text
Usuário
  │
  ├── Login / Cadastro / Recuperação
  │
  ▼
Frontend React
  │
  │ JWT
  ▼
Spring Security
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ├── Regras de negócio
  ├── Permissões
  └── Validações
  │
  ▼
DAOs / JPA
  │
  ▼
PostgreSQL / Supabase
```

---

# Objetivo acadêmico

O projeto demonstra, de forma integrada:

- programação orientada a objetos;
- desenvolvimento de API REST;
- desenvolvimento frontend;
- banco de dados relacional;
- autenticação e autorização;
- arquitetura em camadas;
- integração frontend/backend;
- controle de versão com Git;
- migrations de banco;
- tratamento de erros;
- validação de dados;
- regras de negócio;
- documentação de API.

---

# Autores

Michael Delego e Daniel Alves

Projeto desenvolvido para fins acadêmicos.

Repositório:

https://github.com/Danielalves33147/LeadFlow---Projeto-1

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos e educacionais.
