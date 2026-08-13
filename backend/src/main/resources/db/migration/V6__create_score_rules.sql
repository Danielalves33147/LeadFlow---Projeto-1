CREATE TABLE score_rules (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  interaction_type VARCHAR(30) NOT NULL,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('ADD','SUBTRACT','SET')),
  value INTEGER NOT NULL CHECK (value >= 0),
  status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')),
  company_id BIGINT NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_score_rules_company ON score_rules(company_id);
CREATE UNIQUE INDEX uk_score_rule_active_type ON score_rules(company_id, interaction_type) WHERE status = 'ACTIVE';
