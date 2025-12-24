CREATE TABLE IF NOT EXISTS verifications (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX verifications_identifier_idx ON verifications(identifier);
