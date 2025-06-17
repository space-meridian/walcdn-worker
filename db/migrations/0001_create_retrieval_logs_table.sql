-- Migration number: 0001 	 2025-05-23T08:31:24.810Z
CREATE TABLE retrieval_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME NOT NULL,
  aggregator_url TEXT NOT NULL,
  client_address TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  egress_bytes INTEGER,
  cache_miss BOOLEAN NOT NULL,
  fetch_ttfb INTEGER,
  fetch_ttlb INTEGER,
  worker_ttfb INTEGER,
  request_country_code TEXT
);
