CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    runtime_version VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    commit_hash VARCHAR(255) NOT NULL,
    commit_message VARCHAR(255) NOT NULL,
    update_id VARCHAR(255)
);

CREATE INDEX releases_timestamp_idx ON releases(timestamp);
CREATE INDEX releases_runtime_version_semver_idx ON releases(((string_to_array((runtime_version)::text, '.'::text))::bigint[]));
CREATE INDEX releases_runtime_version_idx ON releases(runtime_version);
CREATE INDEX releases_path_idx ON releases(path);
