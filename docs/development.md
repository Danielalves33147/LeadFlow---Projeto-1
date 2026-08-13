# Desenvolvimento local

## Requisitos

- Java 21
- Maven 3.9+
- Node.js 22+
- PostgreSQL 16+

## Backend

```bash
cd backend
mvn clean test
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Defina `VITE_API_URL=http://localhost:8080/api/v1` em `frontend/.env` quando necessário.

## Docker

Na raiz:

```bash
cp .env.example .env
docker compose up --build
```

Frontend: `http://localhost:8081`; API: `http://localhost:8080`; Swagger: `http://localhost:8080/swagger-ui`.
