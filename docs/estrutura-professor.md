# Estrutura Java adotada

O backend foi organizado para manter explicitamente os quatro pacotes exigidos no padrão acadêmico:

```text
src/main/java/br/com/leadflow/
├── controller/      # endpoints HTTP / entrada da aplicação
├── dao/             # acesso ao banco PostgreSQL
├── model/           # entidades JPA do domínio
├── utils/           # utilitários reutilizáveis
├── service/         # regras de negócio
├── dto/             # objetos de entrada e saída da API
├── config/          # configurações do Spring
├── security/        # autenticação e autorização JWT
├── exception/       # erros de negócio e tratamento global
├── specification/   # filtros dinâmicos de consulta
└── validation/      # validadores específicos
```

## Fluxo principal

```text
Controller -> Service -> DAO -> PostgreSQL
                     |
                     -> Model
```

`Utils` pode ser utilizado pelas demais camadas para funções genéricas, mas não deve concentrar regras de negócio.

O frontend permanece separado em `frontend/`, pois é uma aplicação React/Vite. Não foi movido para `src/main/webapp`, que é uma estrutura típica de JSP/Servlet tradicional e não é necessária para esta arquitetura.
