// _components/types.ts
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'ADMIN' | 'CHEF_PARK' | 'PARTICULIER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  enterprise_id?: string;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin_number: string;
  initial_mileage: number;
  user_id: string;
}

export interface Maintenance {
  id: string;
  car_id: string;
  type: 'PREVENTIVE_MAINTENANCE' | 'CORRECTIVE_MAINTENANCE';
  date: string;
  recordedMileage: number;
  cost: number;
  description: string;
  status: 'UPCOMING' | 'DONE' | 'OVERDUE';
  
  car: {
    make: string;
    model: string;
    licensePlate: string;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}