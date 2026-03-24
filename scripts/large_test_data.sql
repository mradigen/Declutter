DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS sites;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
	user_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	email       TEXT UNIQUE,
	password_hash    TEXT
);

CREATE TABLE IF NOT EXISTS sites (
	site_id          UUID PRIMARY KEY,
	user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);


BEGIN;

-- 1. Create the specific test user 'asd@asd.com'
-- We use a fixed UUID for this user to easily reference them if needed, or rely on email.
-- For simplicity in this script, we'll store the ID in a variable or just use a known UUID.
-- Let's use a specific UUID for 'asd@asd.com' to ensure reproducibility.
INSERT INTO users (user_id, email, password_hash)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for asd@asd.com
    'asd@asd.com',
    '$argon2id$v=19$m=65536,t=3,p=4$p7WK5zPyOtq5aNlY2YFqkA$zz+qhQMVxnkGWez2pOasls/LNRJ7YpAiK4fJ8BrGkc0'
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;

-- 2. Create the specific site for 'asd@asd.com'
INSERT INTO sites (site_id, user_id)
VALUES (
    'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    (SELECT user_id FROM users WHERE email = 'asd@asd.com')
)
ON CONFLICT (site_id) DO NOTHING;


-- 3. Generative: Create 20 additional random users
INSERT INTO users (user_id, email, password_hash)
SELECT
    gen_random_uuid(),
    'user_' || i || '@example.com',
    '$argon2id$v=19$m=65536,t=3,p=4$p7WK5zPyOtq5aNlY2YFqkA$zz+qhQMVxnkGWez2pOasls/LNRJ7YpAiK4fJ8BrGkc0' -- Same hash for simplicity
FROM generate_series(1, 20) AS i
ON CONFLICT (email) DO NOTHING;


-- 4. Generative: Create 50 additional sites, randomly assigned to users
INSERT INTO sites (site_id, user_id)
SELECT
    gen_random_uuid(),
    (SELECT user_id FROM users ORDER BY random() LIMIT 1)
FROM generate_series(1, 50) AS i;

COMMIT;
