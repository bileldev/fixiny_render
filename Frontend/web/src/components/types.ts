export type UserRole = 'ADMIN' | 'CHEF_PARK' |'PARTICULIER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MaintenanceStatus = 'DONE' | 'OVERDUE'| 'UPCOMING';
export type MaintenanceType = 'PREVENTIVE_MAINTENANCE' | 'CORRECTIVE_MAINTENANCE'; 
  

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number:string;
  photo?: string;
  role: UserRole;  
  status: UserStatus;
  cars?: Car[];
  createdAt: string;
  updatedAt: string;
  enterprise_id?: string;
};


export interface Enterprise {
  id: string;
  enterprise_name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  zone_name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  enterprise_id: string;
  chef_park_id?: string;
  cars: Car[];
  budget?: Budget;
}

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin_number: string;
  initial_mileage: number;
  createdAt: string;
  updatedAt: string;
  user_id?: string;
  zone_id?: string;
  maintenances?: Maintenance[];
  mileages?: Mileage[];
  zone?: Pick<Zone, 'id' | 'zone_name'>;
  user?: Pick<User, 'id' | 'first_name' | 'last_name'>
};

export interface Mileage {
  id: string;
  value: number;
  recordedAt: string;
  createdAt: string;
  car_id: string;
}

export type Maintenance = {
  id: string;
  car_id: string;
  type: MaintenanceType;
  date: string;
  recordedMileage: number;
  cost: number;
  description?: string;
  status: MaintenanceStatus,
  factureUrl: string,
  createdAt: string;
  updatedAt: string;
  car?: Pick<Car, 'make' | 'model' | 'licensePlate'>;
};

export interface Budget {
  id: string;
  amount: number;
  description?: string;
  fiscalYear: number;
  createdAt: string;
  updatedAt: string;
  zone_id: string;
  zone?: Pick<Zone, 'id' | 'zone_name'>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  readAt?: string;
  user_id: string;
}


  