
export type Role = 'ADMIN' | 'MANAGER' | 'TECHNICIAN';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  branchId?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  status: 'ACTIVE' | 'BROKEN' | 'MAINTENANCE' | 'SCRAPPED';
  purchaseDate: string;
  warrantyExpiry: string;
  supplier: string; // New: Supplier Name
  supplierContact: string; // New: Phone/Email
  initialValue: number;
  branchId: string;
  location: string;
  healthScore: number; // 0-100
  image: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_PARTS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  assetId: string;
  technicianId?: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  location: { lat: number; lng: number };
  formData?: Record<string, any>;
  diagnosis?: string;
  closedAt?: string;
  rating?: number; // 1-5
  feedback?: string; // Manager feedback
  faultType?: string; // New: Type of fault
  imageUrl?: string; // New: Image of the fault
}

export interface Part {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  image: string;
}

// Dynamic Form Types
export type FieldType = 
  | 'text' 
  | 'paragraph' // نص طويل
  | 'number' 
  | 'quantity' // كمية
  | 'select' // قائمة منسدلة
  | 'radio' // اختيار من متعدد
  | 'checkbox' 
  | 'date' 
  | 'image' 
  | 'video' // فيديو
  | 'location'; // موقع

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // For select & radio inputs
  placeholder?: string;
  description?: string;
}

export interface UISchema {
  id: string;
  formKey: string; // e.g., 'new_ticket', 'close_ticket'
  fields: FormField[];
}

export interface SystemConfig {
  geofenceRadius: number; // meters
  technicianRange: number; // km
  slaHighPriorityHours: number;
  slaMediumPriorityHours: number;
  slaLowPriorityHours: number;
  maxImageCount: number;
  enableAIAnalysis: boolean;
  maintenanceMode: boolean;
}

export interface Permission {
  role: Role;
  key: string;
  isAllowed: boolean;
}
