CREATE TABLE IF NOT EXISTS sessions (
    id text NOT NULL,
    expires_at timestamp NOT NULL,
    token text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL,
    CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (id)
);

CREATE INDEX sessions_userId_idx ON sessions(user_id);
CREATE UNIQUE INDEX sessions_token_unique ON sessions(token);
