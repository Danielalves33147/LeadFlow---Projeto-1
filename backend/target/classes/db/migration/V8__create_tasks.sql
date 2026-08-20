CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  lead_id BIGINT NOT NULL REFERENCES leads(id),
  responsible_user_id BIGINT NOT NULL REFERENCES users(id),
  due_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','COMPLETED','CANCELLED','OVERDUE')),
  completed_at TIMESTAMPTZ,
  cancel_reason VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_responsible ON tasks(responsible_user_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_status ON tasks(status);
