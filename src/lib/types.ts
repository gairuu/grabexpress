export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'ewallet';
export type VehicleType = 'Motorcycle' | 'Car' | 'Van';

export interface Customer {
  id: string;
  name: string;
  email: string;
  contact_number: string;
  avatar: string;
  totalDeliveries: number;
  registration_date: string;
}

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicle: VehicleType;
  plate_number: string;
  rating: number;
  totalDeliveries: number;
  status: 'available' | 'busy';
  contact_number: string;
  license_number?: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  plate_number: string;
  vehicle_type: VehicleType;
  vehicle_model: string;
  color: string;
}

export interface Delivery {
  id: string;
  customer_id: string;
  customer_name: string;
  driver_id: string;
  driver_name: string;
  pickup_location: string;
  dropoff_location: string;
  delivery_status: DeliveryStatus;
  delivery_fee: number;
  payment_method: PaymentMethod;
  booking_time: string;
  estimated_time: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name?: string;
  recipient_phone?: string;
  item_size?: 'S' | 'M' | 'L' | 'XL';
  item_weight?: number;
  item_type?: string;
  vehicle_type?: VehicleType;
}

export interface BookingState {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  delivery_fee: number;
  driver: Driver | null;
  delivery_status: DeliveryStatus;
  payment_method: PaymentMethod;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  recipient_phone: string;
  item_size: 'S' | 'M' | 'L' | 'XL';
  item_weight: number;
  item_type: string;
  vehicle_type: VehicleType;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  contact_number?: string;
  avatar: string;
  role: 'customer' | 'driver' | 'admin';
  linkedDriverId?: string;
}
