CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agreed_to_terms BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS registration_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_by INTEGER
);

CREATE TABLE forwarding_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    source_email VARCHAR(255) NOT NULL,
    destination_email VARCHAR(255) NOT NULL,

    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sieve_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    field VARCHAR(50) NOT NULL,        -- from, to, subject, etc.
    match_type VARCHAR(50) DEFAULT 'contains',
    value TEXT NOT NULL,

    action_type VARCHAR(50) NOT NULL,  -- fileinto, redirect, keep
    action_config JSONB NOT NULL,

    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE responder_rules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    enabled BOOLEAN DEFAULT true,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    days INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW()
);