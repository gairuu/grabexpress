import { Customer, Driver, Delivery } from './types';

export const mockCustomers: Customer[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Maria Santos', email: 'maria@email.com', phone: '09171234567', avatar: 'MS', totalDeliveries: 24, joinedDate: '2024-01-15' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Juan Dela Cruz', email: 'juan@email.com', phone: '09281234567', avatar: 'JD', totalDeliveries: 11, joinedDate: '2024-03-02' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Ana Reyes', email: 'ana@email.com', phone: '09391234567', avatar: 'AR', totalDeliveries: 37, joinedDate: '2023-11-20' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Carlos Mendoza', email: 'carlos@email.com', phone: '09451234567', avatar: 'CM', totalDeliveries: 8, joinedDate: '2024-05-10' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Lea Gonzales', email: 'lea@email.com', phone: '09561234567', avatar: 'LG', totalDeliveries: 19, joinedDate: '2024-02-28' },
];

export const mockDrivers: Driver[] = [
  { id: '7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', name: 'Ramon Delos Reyes', avatar: 'RD', vehicle: 'Motorcycle', plateNumber: 'ABC 1234', rating: 4.9, totalDeliveries: 312, isAvailable: true, phone: '09171112222' },
  { id: '8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', name: 'Felix Torres', avatar: 'FT', vehicle: 'Motorcycle', plateNumber: 'XYZ 5678', rating: 4.7, totalDeliveries: 198, isAvailable: true, phone: '09281112222' },
  { id: '9d5e3d04-0d6f-6a1c-1a3c-0e3d0d6f6a1c', name: 'Noel Bautista', avatar: 'NB', vehicle: 'Car', plateNumber: 'DEF 9012', rating: 4.8, totalDeliveries: 254, isAvailable: false, phone: '09391112222' },
  { id: '0e6f4e15-1e7a-7b2d-2b4d-1f4e1e7a7b2d', name: 'Rommel Castillo', avatar: 'RC', vehicle: 'Van', plateNumber: 'GHI 3456', rating: 4.6, totalDeliveries: 87, isAvailable: true, phone: '09451112222' },
  { id: '1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', name: 'Danilo Mercado', avatar: 'DM', vehicle: 'Motorcycle', plateNumber: 'JKL 7890', rating: 5.0, totalDeliveries: 421, isAvailable: true, phone: '09561112222' },
];

export const mockDeliveries: Delivery[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', customerId: '11111111-1111-1111-1111-111111111111', customerName: 'Maria Santos', driverId: '7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', driverName: 'Ramon Delos Reyes', pickup: 'BGC, Taguig City', dropoff: 'Makati CBD, Makati', status: 'delivered', fee: 85, paymentMethod: 'ewallet', createdAt: '2025-04-20T10:00:00', estimatedTime: '25 mins' },
  { id: 'b2222222-2222-2222-2222-222222222222', customerId: '11111111-1111-1111-1111-111111111111', customerName: 'Maria Santos', driverId: '8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', driverName: 'Felix Torres', pickup: 'Eastwood, Quezon City', dropoff: 'Ortigas, Pasig City', status: 'delivered', fee: 120, paymentMethod: 'cash', createdAt: '2025-04-18T14:30:00', estimatedTime: '30 mins' },
  { id: 'c3333333-3333-3333-3333-333333333333', customerId: '11111111-1111-1111-1111-111111111111', customerName: 'Maria Santos', driverId: '1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', driverName: 'Danilo Mercado', pickup: 'SM Mall of Asia, Pasay', dropoff: 'Alabang, Muntinlupa', status: 'in_transit', fee: 175, paymentMethod: 'card', createdAt: '2025-04-22T09:15:00', estimatedTime: '45 mins' },
];
