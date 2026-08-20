CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(180),
  origin VARCHAR(30) NOT NULL,
  cep VARCHAR(8),
  stage VARCHAR(20) NOT NULL CHECK (stage IN ('NEW','CONTACTED','NEGOTIATION','CUSTOMER','LOST')),
  score INTEGER NOT NULL DEFAULT 0,
  branch_id BIGINT NOT NULL REFERENCES branches(id),
  responsible_user_id BIGINT NOT NULL REFERENCES users(id),
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_leads_branch ON leads(branch_id);
CREATE INDEX idx_leads_responsible ON leads(responsible_user_id);
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_name_lower ON leads(LOWER(name));
