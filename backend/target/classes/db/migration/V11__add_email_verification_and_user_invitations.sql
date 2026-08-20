ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
    ADD CONSTRAINT users_status_check
    CHECK (
        status IN (
            'PENDING_EMAIL_VERIFICATION',
            'ACTIVE',
            'INACTIVE'
        )
    );

ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMPTZ;


CREATE TABLE email_verification_tokens (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_email_verification_tokens_user
    ON email_verification_tokens(user_id);

CREATE INDEX idx_email_verification_tokens_hash
    ON email_verification_tokens(token_hash);


CREATE TABLE user_invitations (
    id BIGSERIAL PRIMARY KEY,

    company_id BIGINT NOT NULL
        REFERENCES companies(id),

    invited_by_user_id BIGINT NOT NULL
        REFERENCES users(id),

    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'MANAGER', 'SELLER')),

    primary_branch_id BIGINT
        REFERENCES branches(id),

    manager_id BIGINT
        REFERENCES users(id),

    token_hash VARCHAR(64) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'EXPIRED',
                'REVOKED'
            )
        ),

    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_user_invitations_company
    ON user_invitations(company_id);

CREATE INDEX idx_user_invitations_email
    ON user_invitations(LOWER(email));

CREATE INDEX idx_user_invitations_token
    ON user_invitations(token_hash);


CREATE TABLE user_invitation_branches (
    invitation_id BIGINT NOT NULL
        REFERENCES user_invitations(id)
        ON DELETE CASCADE,

    branch_id BIGINT NOT NULL
        REFERENCES branches(id)
        ON DELETE CASCADE,

    PRIMARY KEY (invitation_id, branch_id)
);