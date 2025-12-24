CREATE TABLE IF NOT EXISTS users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified bool NOT NULL DEFAULT false,
    image text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE UNIQUE INDEX users_email_unique ON users(email);
