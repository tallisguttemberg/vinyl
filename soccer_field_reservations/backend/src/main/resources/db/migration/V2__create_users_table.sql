CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);
