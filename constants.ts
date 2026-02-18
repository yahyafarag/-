import { Asset, Part, Ticket, User, UISchema, SystemConfig } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'مدير النظام', role: 'ADMIN', avatar: 'https://picsum.photos/seed/admin/200/200' },
  { id: 'u2', name: 'فني صيانة 1', role: 'TECHNICIAN', branchId: 'b1', avatar: 'https://picsum.photos/seed/tech1/200/200' },
  { id: 'u3', name: 'مدير الفرع', role: 'MANAGER', branchId: 'b1', avatar: 'https://picsum.photos/seed/mgr1/200/200' },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'خلاط صناعي X200',
    serialNumber: 'MX-2023-001',
    category: 'خلاطات',
    status: 'ACTIVE',
    purchaseDate: '2023-01-15',
    warrantyExpiry: '2025-01-15',
    supplier: 'شركة الاتحاد للتوريدات',
    supplierContact: '01012345678',
    initialValue: 15000,
    branchId: 'b1',
    location: 'منطقة أ',
    healthScore: 92,
    image: 'https://picsum.photos/seed/mixer/400/300'
  },
  {
    id: 'a2',
    name: 'وحدة تبريد C5',
    serialNumber: 'CL-2022-884',
    category: 'تبريد وتكييف',
    status: 'BROKEN',
    purchaseDate: '2022-05-20',
    warrantyExpiry: '2024-05-20',
    supplier: 'المصرية للتكييفات',
    supplierContact: '01229876543',
    initialValue: 8000,
    branchId: 'b1',
    location: 'السطح',
    healthScore: 45,
    image: 'https://picsum.photos/seed/cooler/400/300'
  },
  {
    id: 'a3',
    name: 'روبوت تعبئة V3',
    serialNumber: 'PK-2024-102',
    category: 'روبوتات',
    status: 'MAINTENANCE',
    purchaseDate: '2024-02-10',
    warrantyExpiry: '2026-02-10',
    supplier: 'تكنو سمارت',
    supplierContact: 'support@technosmart.eg',
    initialValue: 25000,
    branchId: 'b1',
    location: 'منطقة ج',
    healthScore: 78,
    image: 'https://picsum.photos/seed/robot/400/300'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    title: 'تسريب في وحدة التبريد',
    description: 'يوجد تسريب مياه من الصمام الرئيسي.',
    assetId: 'a2',
    technicianId: 'u2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
    updatedAt: new Date().toISOString(),
    location: { lat: 24.7136, lng: 46.6753 },
    diagnosis: 'فشل في الختم المطاطي للصمام.'
  },
  {
    id: 't2',
    title: 'اهتزاز في الخلاط',
    description: 'اهتزاز غير طبيعي أثناء التشغيل بالسرعة العالية.',
    assetId: 'a1',
    technicianId: 'u2',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    location: { lat: 24.7136, lng: 46.6753 }
  }
];

export const MOCK_PARTS: Part[] = [
  { id: 'p1', name: 'حلقة ختم الصمام', category: 'تبريد وتكييف', stock: 15, minStock: 5, price: 25, image: 'https://picsum.photos/seed/seal/100/100' },
  { id: 'p2', name: 'سير محرك الخلاط', category: 'خلاطات', stock: 3, minStock: 5, price: 120, image: 'https://picsum.photos/seed/belt/100/100' },
  { id: 'p3', name: 'لوحة تحكم إلكترونية', category: 'إلكترونيات', stock: 8, minStock: 2, price: 450, image: 'https://picsum.photos/seed/circuit/100/100' },
];

export const DEFAULT_CONFIG: SystemConfig = {
  geofenceRadius: 200, // meters
  technicianRange: 50, // km
  slaHighPriorityHours: 4,
  slaMediumPriorityHours: 24,
  slaLowPriorityHours: 72,
  maxImageCount: 5,
  enableAIAnalysis: true,
  maintenanceMode: false,
};

export const DEFAULT_TICKET_SCHEMA: UISchema = {
  id: 's1',
  formKey: 'ticket_diagnosis',
  fields: [
    { key: 'error_code', label: 'كود الخطأ (إن وجد)', type: 'text', required: false, placeholder: 'مثال: E-404' },
    { key: 'noise_level', label: 'مستوى الضجيج', type: 'select', required: true, options: ['طبيعي', 'عالي', 'صرير', 'قعقعة'] },
    { key: 'temperature', label: 'درجة حرارة التشغيل (مئوية)', type: 'number', required: false },
    { key: 'visual_damage', label: 'هل يوجد ضرر ظاهري؟', type: 'checkbox', required: false }
  ]
};