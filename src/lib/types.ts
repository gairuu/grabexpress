export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'ewallet';
export type VehicleType = 'Motorcycle' | 'Car' | 'Van';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  totalDeliveries: number;
  joinedDate: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicle: VehicleType;
  plateNumber: string;
  rating: number;
  totalDeliveries: number;
  isAvailable: boolean;
  phone: string;
}

export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  driverId: string;
  driverName: string;
  pickup: string;
  dropoff: string;
  status: DeliveryStatus;
  fee: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  estimatedTime: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  itemSize?: 'S' | 'M' | 'L' | 'XL';
  itemWeight?: number;
  itemType?: string;
  vehicleType?: VehicleType;
}

export interface BookingState {
  id: string;
  pickup: string;
  dropoff: string;
  fee: number;
  driver: Driver | null;
  status: DeliveryStatus;
  paymentMethod: PaymentMethod;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  itemSize: 'S' | 'M' | 'L' | 'XL';
  itemWeight: number;
  itemType: string;
  vehicleType: VehicleType;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'customer' | 'driver' | 'admin';
  linkedDriverId?: string;
}
