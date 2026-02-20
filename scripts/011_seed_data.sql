-- 011: Seed default vehicle types and services

-- Vehicle types
insert into public.vehicle_types (name, description, sort_order) values
  ('Sedan', 'Vehiculo sedan estandar', 1),
  ('SUV / Camioneta', 'SUV o camioneta mediana', 2),
  ('Pick-Up', 'Camioneta pick-up', 3),
  ('Compacto', 'Vehiculo compacto o hatchback', 4)
on conflict do nothing;

-- Default services
insert into public.services (name, description, base_price, sort_order) values
  ('Lavado Basico', 'Lavado exterior con agua y jabon, secado manual', 5.00, 1),
  ('Lavado Premium', 'Lavado exterior e interior, aspirado, limpieza de tablero', 10.00, 2),
  ('Lavado VIP', 'Lavado completo, encerado, limpieza de motor, aromatizante', 18.00, 3),
  ('Detailing Completo', 'Servicio completo de detailing interior y exterior', 30.00, 4)
on conflict do nothing;
