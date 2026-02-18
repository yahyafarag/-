import { Asset, Part, Ticket, User, UISchema, SystemConfig } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', role: 'ADMIN', avatar: 'https://picsum.photos/seed/admin/200/200' },
  { id: 'u2', name: 'Tech John', role: 'TECHNICIAN', branchId: 'b1', avatar: 'https://picsum.photos/seed/tech1/200/200' },
  { id: 'u3', name: 'Manager Sarah', role: 'MANAGER', branchId: 'b1', avatar: 'https://picsum.photos/seed/mgr1/200/200' },
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Industrial Mixer X200',
    serialNumber: 'MX-2023-001',
    category: 'Mixers',
    status: 'ACTIVE',
    purchaseDate: '2023-01-15',
    warrantyExpiry: '2025-01-15',
    initialValue: 15000,
    branchId: 'b1',
    location: 'Zone A',
    healthScore: 92,
    image: 'https://picsum.photos/seed/mixer/400/300'
  },
  {
    id: 'a2',
    name: 'Cooling Unit C5',
    serialNumber: 'CL-2022-884',
    category: 'HVAC',
    status: 'BROKEN',
    purchaseDate: '2022-05-20',
    warrantyExpiry: '2024-05-20', // Expired
    initialValue: 8000,
    branchId: 'b1',
    location: 'Roof Top',
    healthScore: 45,
    image: 'https://picsum.photos/seed/cooler/400/300'
  },
  {
    id: 'a3',
    name: 'Packaging Bot V3',
    serialNumber: 'PK-2024-102',
    category: 'Robotics',
    status: 'MAINTENANCE',
    purchaseDate: '2024-02-10',
    warrantyExpiry: '2026-02-10',
    initialValue: 25000,
    branchId: 'b1',
    location: 'Zone C',
    healthScore: 78,
    image: 'https://picsum.photos/seed/robot/400/300'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    title: 'Cooling Unit Leakage',
    description: 'Water leaking from the main valve.',
    assetId: 'a2',
    technicianId: 'u2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString(),
    location: { lat: 24.7136, lng: 46.6753 },
    diagnosis: 'Seal failure detected on primary valve.'
  },
  {
    id: 't2',
    title: 'Mixer Vibration',
    description: 'Unusual vibration during high speed operation.',
    assetId: 'a1',
    technicianId: 'u2',
    status: 'OPEN',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    updatedAt: new Date().toISOString(),
    location: { lat: 24.7136, lng: 46.6753 }
  }
];

export const MOCK_PARTS: Part[] = [
  { id: 'p1', name: 'Valve Seal Ring', category: 'HVAC', stock: 15, minStock: 5, price: 25, image: 'https://picsum.photos/seed/seal/100/100' },
  { id: 'p2', name: 'Mixer Motor Belt', category: 'Mixers', stock: 3, minStock: 5, price: 120, image: 'https://picsum.photos/seed/belt/100/100' },
  { id: 'p3', name: 'Circuit Board V2', category: 'Electronics', stock: 8, minStock: 2, price: 450, image: 'https://picsum.photos/seed/circuit/100/100' },
];

export const DEFAULT_CONFIG: SystemConfig = {
  geofenceRadius: 200,
  slaHighPriorityHours: 4,
  maxImageCount: 5,
  enableAIAnalysis: true,
};

export const DEFAULT_TICKET_SCHEMA: UISchema = {
  id: 's1',
  formKey: 'ticket_diagnosis',
  fields: [
    { key: 'error_code', label: 'Error Code (if any)', type: 'text', required: false, placeholder: 'E.g. E-404' },
    { key: 'noise_level', label: 'Noise Level', type: 'select', required: true, options: ['Normal', 'Loud', 'Screeching', 'Rattling'] },
    { key: 'temperature', label: 'Operating Temp (C)', type: 'number', required: false },
    { key: 'visual_damage', label: 'Visible Damage?', type: 'checkbox', required: false }
  ]
};