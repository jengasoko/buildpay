export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  employer_id: number | null;
  employer_username: string;
}

export type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'FINANCIAL_OFFICER'
  | 'EMPLOYER'
  | 'EMPLOYEE';

export interface Project {
  id: number;
  name: string;
  location: string;
  description: string | null;
  start_date: string;
  expected_completion: string;
  actual_completion: string | null;
  created_at: string;
}

export interface ProjectCreate {
  name: string;
  location: string;
  description?: string;
  start_date: string;
  expected_completion: string;
  actual_completion?: string;
}

export interface ProjectUpdate {
  name?: string;
  location?: string;
  description?: string;
  start_date?: string;
  expected_completion?: string;
  actual_completion?: string;
}

export interface House {
  id: number;
  project_id: number | null;
  title: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  location: string;
  rent_price: number;
  price: number;
  image_url: string | null;
  available: boolean;
  created_at: string;
}

export interface HouseCreate {
  project_id?: number;
  title: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  location: string;
  rent_price: number;
  price?: number;
  image_url?: string;
  available?: boolean;
}

export interface HouseUpdate {
  project_id?: number;
  title?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  location?: string;
  rent_price?: number;
  price?: number;
  image_url?: string;
  available?: boolean;
}

export type ApplicationStatus =
  | 'PENDING'
  | 'EMPLOYER_APPROVED'
  | 'FINANCIAL_APPROVED'
  | 'REJECTED';

export interface Application {
  id: number;
  employee_id: number;
  house_id: number;
  status: ApplicationStatus;
  created_at: string;
  house_title: string;
  employee_username: string;
  employer_username: string;
}

export interface ApplicationCreate {
  employee_id: number;
  house_id: number;
}

export interface ApplicationUpdate {
  status: ApplicationStatus;
}

export interface Payment {
  id: number;
  application_id: number | null;
  amount: number;
  payment_date: string;
  reference: string | null;
  created_at: string;
  application_house_title: string;
  application_employee_username: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface QueryParams {
  page?: number;
  page_size?: number;
  available_only?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  phone?: string;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface PaymentCreate {
  application_id?: number;
  amount: number;
  reference?: string;
}

export interface PaymentUpdate {
  amount?: number;
  reference?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface DashboardCounts {
  users: number;
  employees: number;
  employers: number;
  projects: number;
  houses: number;
  available_houses: number;
  occupied_houses: number;
  applications: number;
  pending_applications: number;
  employer_approved_applications: number;
  financial_approved_applications: number;
  rejected_applications: number;
  payments: number;
  active_occupancies: number;
}

export interface DashboardStats {
  counts: DashboardCounts;
  total_payment_amount: number;
  recent_applications: Application[];
}

export interface SystemLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  timestamp: string;
}

export interface Employment {
  id: number;
  employer_id: number;
  employee_id: number;
  created_at: string;
  employer_username: string;
  employee_username: string;
}

export interface EmploymentCreate {
  employer_id: number;
  employee_id: number;
}

export interface Occupancy {
  id: number;
  application_id: number;
  house_id: number;
  employee_id: number;
  started_at: string;
  ended_at: string | null;
  house_title: string;
  employee_username: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
