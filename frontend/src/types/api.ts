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
  review_note: string | null;
  reviewed_by: string;
  reviewed_at: string | null;
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
  status?: ApplicationStatus;
  review_note?: string;
}

export interface Payment {
  id: number;
  application_id: number | null;
  invoice_id: number | null;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
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
  invoice_id?: number;
  amount: number;
  method?: PaymentMethod;
  reference?: string;
}

export interface PaymentUpdate {
  application_id?: number;
  invoice_id?: number;
  amount?: number;
  method?: PaymentMethod;
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

// ---- Phase 5/6: Leases, Rooms, Billing, Maintenance, Reports ----

export type LeaseStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'TERMINATED'
  | 'EXPIRED';

export type BlockType = 'PRIVATE' | 'SHARED' | 'DORMITORY' | 'OTHER';

export type InvoiceStatus = 'OPEN' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';

export type ChargeType = 'RENT' | 'DEPOSIT' | 'UTILITY' | 'LATE_FEE' | 'OTHER';

export type PaymentMethod = 'CASH' | 'EFT' | 'CARD' | 'PAYROLL_DEDUCTION';

export type MaintenanceStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

export type MaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'STRUCTURAL'
  | 'PEST_CONTROL'
  | 'APPLIANCE'
  | 'OTHER';

export interface Room {
  id: number;
  house_id: number;
  room_number: string;
  block_type: BlockType;
  capacity: number;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  house_title: string;
}

export interface RoomCreate {
  house_id: number;
  room_number: string;
  block_type?: BlockType;
  capacity?: number;
  is_available?: boolean;
  notes?: string;
}

export interface RoomUpdate {
  room_number?: string;
  block_type?: BlockType;
  capacity?: number;
  is_available?: boolean;
  notes?: string;
}

export interface Lease {
  id: number;
  occupancy_id: number;
  employee_id: number;
  house_id: number;
  room_id: number | null;
  rent_amount: number;
  deposit_amount: number;
  deposit_paid: boolean;
  start_date: string;
  end_date: string | null;
  billing_day: number;
  late_fee_amount: number;
  status: LeaseStatus;
  signed_at: string | null;
  created_at: string;
  house_title: string;
  employee_username: string;
  room_number: string;
}

export interface LeaseCreate {
  occupancy_id: number;
  rent_amount: number;
  deposit_amount?: number;
  start_date: string;
  end_date?: string;
  billing_day?: number;
  late_fee_amount?: number;
  room_id?: number;
}

export interface LeaseUpdate {
  rent_amount?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  end_date?: string;
  billing_day?: number;
  room_id?: number;
}

export interface Charge {
  id: number;
  invoice_id: number;
  charge_type: ChargeType;
  label: string;
  amount: number;
}

export interface Invoice {
  id: number;
  lease_id: number;
  period_start: string;
  period_end: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  late_fee_amount: number;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  balance_due: number;
  house_title: string;
  employee_username: string;
  charges: Charge[];
}

export interface InvoiceAllocateRequest {
  payment_id?: number;
  amount: number;
  method?: PaymentMethod;
  reference?: string;
}

export interface ArrearsBucket {
  bucket: string;
  count: number;
  amount: number;
}

export interface ArrearsSummary {
  total_outstanding: number;
  total_overdue: number;
  buckets: ArrearsBucket[];
}

export interface StatementEntry {
  date: string;
  type: 'INVOICE' | 'PAYMENT';
  description: string;
  amount: number;
  running_balance: number;
}

export interface StatementOfAccount {
  lease: Lease;
  balance: number;
  entries: StatementEntry[];
}

export interface MaintenanceRequest {
  id: number;
  house_id: number;
  room_id: number | null;
  employee_id: number;
  reported_by_id: number | null;
  category: MaintenanceCategory;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  status: MaintenanceStatus;
  assigned_to_id: number | null;
  assigned_by_id: number | null;
  assigned_to_username: string;
  resolution_note: string | null;
  photos: string[];
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  house_title: string;
  employee_username: string;
}

export interface MaintenanceCreate {
  house_id: number;
  room_id?: number;
  employee_id?: number;
  category?: MaintenanceCategory;
  title: string;
  description: string;
  priority?: 'low' | 'normal' | 'high';
  photos?: string[];
}

export interface MaintenanceUpdate {
  room_id?: number;
  category?: MaintenanceCategory;
  title?: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  status?: MaintenanceStatus;
  assigned_to_id?: number;
  resolution_note?: string;
}

export interface EmployeeDashboard {
  counts: {
    applications: number;
    open_maintenance: number;
    active_invoice_count: number;
  };
  application: Application | null;
  lease: Lease | null;
  account_balance: number;
  next_invoice_due: string | null;
  recent_invoices: Invoice[];
  open_maintenance: number;
}

export interface FinancialReport {
  month: number;
  year: number;
  collected: number;
  outstanding: number;
  overdue: number;
  open_invoices: number;
  active_leases: number;
  arrears: ArrearsBucket[];
}

export interface OccupancyReport {
  total_houses: number;
  available_houses: number;
  occupied_houses: number;
  active_leases: number;
  by_house: Array<{
    house_id: number;
    title: string;
    available: boolean;
    occupants: number;
  }>;
}

// ---- Phase 7: Reporting & Analytics ----

export interface TrendPoint {
  month: string;
  value: number;
}

export interface OccupancyTrendPoint {
  month: string;
  occupied: number;
  total: number;
}

export interface CollectionRatePoint {
  month: string;
  invoiced: number;
  collected: number;
  rate: number;
}

export interface RevenueTrendResponse {
  data: TrendPoint[];
}

export interface OccupancyTrendResponse {
  data: OccupancyTrendPoint[];
}

export interface CollectionRateResponse {
  data: CollectionRatePoint[];
}

// ---- Phase 8: Role-based dashboards ----

export interface EmployerStaffSummary {
  total: number;
  with_lease: number;
  pending_approval: number;
}

export interface EmployerTeamLease {
  employee_username: string;
  house_title: string;
  room_number: string | null;
  start_date: string | null;
  status: string;
}

export interface EmployerDashboard {
  staff: EmployerStaffSummary;
  team_houses: number;
  pending_applications: number;
  active_leases: number;
  open_maintenance: number;
  recent_applications: Application[];
  team_leases: EmployerTeamLease[];
}

export interface FinancialDashboard {
  month: number;
  year: number;
  collected_this_month: number;
  collected_all_time: number;
  outstanding: number;
  overdue: number;
  collection_rate: number;
  open_invoices: number;
  active_leases: number;
  recent_payments: Payment[];
  arrears: ArrearsBucket[];
}
