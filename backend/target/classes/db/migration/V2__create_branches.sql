CREATE TABLE branches (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  company_id BIGINT NOT NULL REFERENCES companies(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT uk_branch_name_company UNIQUE (company_id, name)
);
CREATE INDEX idx_branches_company ON branches(company_id);
