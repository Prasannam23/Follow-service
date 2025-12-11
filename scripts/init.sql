-- Insert predefined users
INSERT INTO "User" (id, username, "displayName") VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice', 'Alice'),
  ('22222222-2222-2222-2222-222222222222', 'bob', 'Bob'),
  ('33333333-3333-3333-3333-333333333333', 'charlie', 'Charlie'),
  ('44444444-4444-4444-4444-444444444444', 'diana', 'Diana'),
  ('55555555-5555-5555-5555-555555555555', 'eve', 'Eve')
ON CONFLICT (username) DO NOTHING;
