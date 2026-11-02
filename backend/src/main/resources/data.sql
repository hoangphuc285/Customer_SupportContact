-- Du lieu khoi tao (idempotent, MySQL). Chay tu dong sau khi Hibernate tao bang.
INSERT IGNORE INTO departments (code, name, created_at, updated_at) VALUES
  ('SUPPORT',    'Cham soc khach hang', now(6), now(6)),
  ('WAREHOUSE',  'Kho',                 now(6), now(6)),
  ('DELIVERY',   'Giao hang',           now(6), now(6)),
  ('TECH',       'Ky thuat',            now(6), now(6)),
  ('ACCOUNTING', 'Ke toan',             now(6), now(6)),
  ('SALES',      'Kinh doanh',          now(6), now(6)),
  ('LEGAL',      'Phap che',            now(6), now(6));

-- SLA mac dinh (phut): P1 15p/4h, P2 1h/24h, P3 24h/72h, P4 48h/120h
INSERT IGNORE INTO sla_rules (priority, category, first_response_minutes, resolution_minutes, created_at, updated_at) VALUES
  ('P1', 'DEFAULT',   15,   240, now(6), now(6)),
  ('P2', 'DEFAULT',   60,  1440, now(6), now(6)),
  ('P3', 'DEFAULT', 1440,  4320, now(6), now(6)),
  ('P4', 'DEFAULT', 2880,  7200, now(6), now(6)),
  ('P1', 'COMPLAINT', 15,   120, now(6), now(6)),
  ('P2', 'REFUND',    60,   720, now(6), now(6));
