import { Customer, Driver, Delivery } from './types';

export const mockCustomers: Customer[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Maria Santos', email: 'maria@email.com', contact_number: '09171234567', avatar: 'MS', totalDeliveries: 24, registration_date: '2024-01-15' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Juan Dela Cruz', email: 'juan@email.com', contact_number: '09281234567', avatar: 'JD', totalDeliveries: 11, registration_date: '2024-03-02' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Ana Reyes', email: 'ana@email.com', contact_number: '09391234567', avatar: 'AR', totalDeliveries: 37, registration_date: '2023-11-20' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Carlos Mendoza', email: 'carlos@email.com', contact_number: '09451234567', avatar: 'CM', totalDeliveries: 8, registration_date: '2024-05-10' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Lea Gonzales', email: 'lea@email.com', contact_number: '09561234567', avatar: 'LG', totalDeliveries: 19, registration_date: '2024-02-28' },
];

export const mockDrivers: Driver[] = [
  { id: '7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', name: 'Ramon Delos Reyes', avatar: 'RD', vehicle: 'Motorcycle', plate_number: 'ABC 1234', rating: 4.9, totalDeliveries: 312, status: 'available', contact_number: '09171112222' },
  { id: '8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', name: 'Felix Torres', avatar: 'FT', vehicle: 'Motorcycle', plate_number: 'XYZ 5678', rating: 4.7, totalDeliveries: 198, status: 'available', contact_number: '09281112222' },
  { id: '9d5e3d04-0d6f-6a1c-1a3c-0e3d0d6f6a1c', name: 'Noel Bautista', avatar: 'NB', vehicle: 'Car', plate_number: 'DEF 9012', rating: 4.8, totalDeliveries: 254, status: 'busy', contact_number: '09391112222' },
  { id: '0e6f4e15-1e7a-7b2d-2b4d-1f4e1e7a7b2d', name: 'Rommel Castillo', avatar: 'RC', vehicle: 'Van', plate_number: 'GHI 3456', rating: 4.6, totalDeliveries: 87, status: 'available', contact_number: '09451112222' },
  { id: '1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', name: 'Danilo Mercado', avatar: 'DM', vehicle: 'Motorcycle', plate_number: 'JKL 7890', rating: 5.0, totalDeliveries: 421, status: 'available', contact_number: '09561112222' },
];

export const mockDeliveries: Delivery[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', customer_id: '11111111-1111-1111-1111-111111111111', customer_name: 'Maria Santos', driver_id: '7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', driver_name: 'Ramon Delos Reyes', pickup_location: 'BGC, Taguig City', dropoff_location: 'Makati CBD, Makati', delivery_status: 'delivered', delivery_fee: 85, payment_method: 'ewallet', booking_time: '2025-04-20T10:00:00', estimated_time: '25 mins' },
  { id: 'b2222222-2222-2222-2222-222222222222', customer_id: '11111111-1111-1111-1111-111111111111', customer_name: 'Maria Santos', driver_id: '8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', driver_name: 'Felix Torres', pickup_location: 'Eastwood, Quezon City', dropoff_location: 'Ortigas, Pasig City', delivery_status: 'delivered', delivery_fee: 120, payment_method: 'cash', booking_time: '2025-04-18T14:30:00', estimated_time: '30 mins' },
  { id: 'c3333333-3333-3333-3333-333333333333', customer_id: '11111111-1111-1111-1111-111111111111', customer_name: 'Maria Santos', driver_id: '1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', driver_name: 'Danilo Mercado', pickup_location: 'SM Mall of Asia, Pasay', dropoff_location: 'Alabang, Muntinlupa', delivery_status: 'in_transit', delivery_fee: 175, payment_method: 'card', booking_time: '2025-04-22T09:15:00', estimated_time: '45 mins' },
];
