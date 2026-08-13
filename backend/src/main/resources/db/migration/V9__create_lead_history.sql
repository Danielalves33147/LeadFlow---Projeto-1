CREATE TABLE lead_history (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id),
  event_type VARCHAR(30) NOT NULL,
  previous_value VARCHAR(250),
  new_value VARCHAR(250),
  performed_by BIGINT NOT NULL REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_lead_history_lead ON lead_history(lead_id, created_at DESC);
