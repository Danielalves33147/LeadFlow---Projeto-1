CREATE TABLE interactions (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id),
  responsible_user_id BIGINT NOT NULL REFERENCES users(id),
  channel VARCHAR(20) NOT NULL,
  type VARCHAR(30) NOT NULL,
  notes TEXT,
  score_applied INTEGER NOT NULL DEFAULT 0,
  score_rule_name VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);
CREATE INDEX idx_interactions_responsible ON interactions(responsible_user_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);
