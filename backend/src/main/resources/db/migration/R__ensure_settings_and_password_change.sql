-- Compatibility migration for installations that already have the historical V13
-- ("expand settings and password change") and for fresh databases created from
-- the repository, where only V1..V12 are versioned locally.
--
-- This script is intentionally idempotent because Flyway repeatable migrations
-- may run again when their checksum changes.

CREATE TABLE IF NOT EXISTS password_change_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_change_tokens_user
    ON password_change_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_change_tokens_hash
    ON password_change_tokens(token_hash);

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS company_email VARCHAR(180),
    ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS street VARCHAR(180),
    ADD COLUMN IF NOT EXISTS address_number VARCHAR(30),
    ADD COLUMN IF NOT EXISTS complement VARCHAR(120),
    ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(120),
    ADD COLUMN IF NOT EXISTS city VARCHAR(120),
    ADD COLUMN IF NOT EXISTS state VARCHAR(2);
