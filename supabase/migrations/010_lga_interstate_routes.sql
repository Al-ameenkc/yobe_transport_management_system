-- Interstate routes from every Yobe boarding town (LGAs + Gashua)
-- Existing Yobe → state routes remain as statewide fallbacks.

INSERT INTO routes (company_id, origin, destination, route_scope, distance_km, base_fare)
SELECT
  r.company_id,
  town.name,
  r.destination,
  'outside_yobe',
  r.distance_km,
  r.base_fare
FROM routes r
CROSS JOIN (
  VALUES
    ('Bade'), ('Bursari'), ('Damaturu'), ('Fika'), ('Fune'),
    ('Geidam'), ('Gashua'), ('Gujba'), ('Gulani'), ('Jakusko'),
    ('Karasuwa'), ('Machina'), ('Nangere'), ('Nguru'), ('Potiskum'),
    ('Tarmuwa'), ('Yunusari'), ('Yusufari')
) AS town(name)
WHERE r.origin = 'Yobe'
  AND r.route_scope = 'outside_yobe'
ON CONFLICT (company_id, origin, destination) DO UPDATE SET
  route_scope = EXCLUDED.route_scope,
  distance_km = EXCLUDED.distance_km,
  base_fare = EXCLUDED.base_fare;

-- Gashua local connections from Damaturu and Potiskum hubs
INSERT INTO routes (company_id, origin, destination, route_scope, distance_km, base_fare)
SELECT
  '11111111-1111-1111-1111-111111111111',
  hub.origin,
  'Gashua',
  'within_yobe',
  95,
  3500
FROM (VALUES ('Damaturu'), ('Potiskum')) AS hub(origin)
ON CONFLICT (company_id, origin, destination) DO UPDATE SET
  route_scope = EXCLUDED.route_scope;

INSERT INTO routes (company_id, origin, destination, route_scope, distance_km, base_fare)
SELECT
  '11111111-1111-1111-1111-111111111111',
  'Gashua',
  hub.dest,
  'within_yobe',
  95,
  3500
FROM (VALUES ('Damaturu'), ('Potiskum')) AS hub(dest)
ON CONFLICT (company_id, origin, destination) DO UPDATE SET
  route_scope = EXCLUDED.route_scope;
