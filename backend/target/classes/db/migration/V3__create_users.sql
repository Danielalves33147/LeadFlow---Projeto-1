CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','MANAGER','SELLER')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')),
  company_id BIGINT NOT NULL REFERENCES companies(id),
  primary_branch_id BIGINT REFERENCES branches(id),
  manager_id BIGINT REFERENCES users(id),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
CREATE INDEX idx_users_primary_branch ON users(primary_branch_id);
CREATE INDEX idx_users_manager ON users(manager_id);
