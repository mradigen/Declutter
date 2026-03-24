DROP TABLE IF EXISTS events;

CREATE TABLE IF NOT EXISTS events (
    eventID          UUID DEFAULT generateUUIDv4(),
    site_id     UUID,
    timestamp   DateTime64(3),
    user_agent  String,
    location    String,
    referrer    String,
    page        String
) ENGINE = ReplacingMergeTree()
ORDER BY (site_id, timestamp);

-- Generative: Create 2500 Events
-- Distributed across randomly generated site IDs
-- Randomized timestamps within the last 30 days
-- Randomized user agents and locations
INSERT INTO events (eventID, site_id, timestamp, user_agent, location, referrer, page)
SELECT
    generateUUIDv4(),
    generateUUIDv4(), -- Generate a random site_id instead of looking up from sites table
    now() - INTERVAL (rand() % (30 * 24 * 3600)) SECOND,
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
     'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
     'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
     'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0']
     [(rand() % 5) + 1],
    ['US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU', 'BR', 'IN']
     [(rand() % 9) + 1],
    ['https://example.com/referrer1', 'https://example.com/referrer2', 'https://example.com/referrer3', 'https://example.com/referrer4', 'https://example.com/referrer5']
     [(rand() % 5) + 1],
    ['/page1', '/page2', '/page3', '/page4', '/page5']
     [(rand() % 5) + 1]
FROM numbers(1, 2500);

-- Make sure to seed some events specifically for the main test site 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
INSERT INTO events (eventID, site_id, timestamp, user_agent, location, referrer, page)
SELECT
    generateUUIDv4(),
    'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    now() - INTERVAL (rand() % (7 * 24 * 3600)) SECOND,
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'US',
    'https://example.com/referrer',
    '/test-page'
FROM numbers(1, 100);
