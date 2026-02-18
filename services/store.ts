
import { create } from 'zustand';
import { supabase } from './supabase';
import { User, Ticket, Asset, Part, SystemConfig, UISchema, Permission, Role, Notification } from '../types';
import { DEFAULT_CONFIG, DEFAULT_TICKET_SCHEMA, MOCK_USERS } from '../constants';

interface AppState {
  user: User | null;
  users: User[];
  assets: Asset[];
  tickets: Ticket[];
  parts: Part[];
  config: SystemConfig;
  ticketSchema: UISchema;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  notifications: Notification[];
  
  // Actions
  login: (userId: string) => void;
  logout: () => void;
  addTicket: (ticket: Ticket) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  rateAndCloseTicket: (id: string, rating: number, feedback: string) => Promise<void>;
  
  // Asset Actions
  addAsset: (asset: Asset) => Promise<void>;
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<boolean>;
  
  // Inventory Actions
  updatePartStock: (id: string, quantityChange: number) => Promise<void>;
  
  // Technician Actions
  completeTicket: (ticketId: string, data: { 
    diagnosis: Record<string, any>, 
    partsUsed: { partId: string, quantity: number }[], 
    finalImage?: string,
    notes?: string
  }) => Promise<void>;

  // Async Actions
  fetchSystemMetadata: () => Promise<void>;
  saveSystemConfig: (config: SystemConfig) => Promise<void>;
  saveTicketSchema: (schema: UISchema) => Promise<void>;
  
  // Permission Actions
  checkPermission: (key: string) => boolean;

  // Notifications
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  removeNotification: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  users: MOCK_USERS,
  assets: [],
  tickets: [],
  parts: [],
  config: DEFAULT_CONFIG,
  ticketSchema: DEFAULT_TICKET_SCHEMA,
  permissions: {},
  isLoading: false,
  notifications: [],

  showNotification: (type, message) => {
    const id = Date.now().toString();
    set(state => ({ notifications: [...state.notifications, { id, type, message }] }));
    setTimeout(() => {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    }, 5000);
  },

  removeNotification: (id) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
  },

  login: (userId: string) => set((state) => ({
    user: state.users.find(u => u.id === userId) || null
  })),

  logout: () => set({ user: null }),

  addTicket: async (ticket: Ticket) => {
    const { showNotification } = get();
    // Optimistic
    set((state) => ({ tickets: [ticket, ...state.tickets] }));
    
    // DB Insert
    const { error } = await supabase.from('tickets').insert([{
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      asset_id: ticket.assetId,
      technician_id: ticket.technicianId,
      status: ticket.status,
      priority: ticket.priority,
      location_lat: ticket.location.lat,
      location_lng: ticket.location.lng,
      diagnosis: ticket.diagnosis
    }]);
    
    if (error) {
      console.error("Error adding ticket:", error);
      showNotification('error', `فشل إضافة البلاغ: ${error.message}`);
      // Revert optimistic update could go here
    } else {
      showNotification('success', 'تم إنشاء البلاغ بنجاح');
    }
  },

  updateTicket: async (id: string, updates: Partial<Ticket>) => {
    const { showNotification } = get();
    set((state) => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.diagnosis) dbUpdates.diagnosis = updates.diagnosis;
    if (updates.closedAt) dbUpdates.closed_at = updates.closedAt;
    
    if (Object.keys(dbUpdates).length > 0) {
       const { error } = await supabase.from('tickets').update(dbUpdates).eq('id', id);
       if (error) {
         showNotification('error', 'فشل تحديث البلاغ');
       } else {
         showNotification('success', 'تم تحديث البلاغ');
       }
    }
  },

  rateAndCloseTicket: async (id: string, rating: number, feedback: string) => {
    const { showNotification } = get();
    
    set((state) => ({
      tickets: state.tickets.map(t => 
        t.id === id ? { ...t, status: 'CLOSED', rating, feedback, closedAt: new Date().toISOString() } : t
      )
    }));

    // Assuming we have rating/feedback columns in DB or store in JSON
    // For this implementation, we will update status and add rating to ticket_form_data or a dedicated field if exists
    // Updating 'diagnosis' field just to persist text for now in demo
    const { error } = await supabase.from('tickets').update({
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      // In a real schema, we would have rating column. 
      // Using description append for demo persistence if column missing, 
      // but ideally: rating: rating, feedback: feedback
    }).eq('id', id);

    if (error) {
      showNotification('error', 'فشل إغلاق وتقييم البلاغ');
    } else {
      showNotification('success', 'تم تأكيد الإصلاح وتقييم الفني');
    }
  },

  addAsset: async (asset: Asset) => {
    const { showNotification } = get();
    set((state) => ({ assets: [asset, ...state.assets] }));
    
    const { error } = await supabase.from('maintenance_assets').insert([{
        name: asset.name,
        serial_number: asset.serialNumber,
        category: asset.category,
        status: asset.status,
        branch_id: asset.branchId,
        initial_value: asset.initialValue,
        image_url: asset.image,
        location: asset.location
    }]);

    if (error) {
      showNotification('error', `فشل إضافة الأصل: ${error.message}`);
    } else {
      showNotification('success', 'تم إضافة الأصل بنجاح');
    }
  },

  updateAsset: async (id: string, updates: Partial<Asset>) => {
    set((state) => ({
      assets: state.assets.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
    // Implement specific DB field updates if needed for detailed editing
  },

  deleteAsset: async (id: string) => {
    const { showNotification } = get();
    const state = get();
    const hasTickets = state.tickets.some(t => t.assetId === id);
    if (hasTickets) {
      showNotification('error', 'لا يمكن حذف الأصل لوجود بلاغات مرتبطة به');
      return false;
    }
    
    set((state) => ({
      assets: state.assets.filter(a => a.id !== id)
    }));
    
    const { error } = await supabase.from('maintenance_assets').delete().eq('id', id);
    if (error) {
      showNotification('error', 'فشل الحذف من قاعدة البيانات');
      return false;
    }
    showNotification('success', 'تم حذف الأصل');
    return true;
  },

  updatePartStock: async (id: string, quantityChange: number) => {
      const { showNotification } = get();
      
      set((state) => ({
        parts: state.parts.map(p => 
          p.id === id ? { ...p, stock: Math.max(0, p.stock + quantityChange) } : p
        )
      }));

      const { error: txError } = await supabase.from('inventory_transactions').insert({
        part_id: id,
        quantity_change: quantityChange,
        transaction_type: quantityChange > 0 ? 'IN' : 'OUT',
        performed_by: get().user?.id
      });

      const part = get().parts.find(p => p.id === id);
      if (part) {
        const { error: updateError } = await supabase.from('spare_parts').update({ current_stock: part.stock }).eq('id', id);
        if (updateError || txError) {
          showNotification('error', 'حدث خطأ أثناء تحديث المخزون');
        } else {
          showNotification('success', 'تم تحديث الرصيد بنجاح');
        }
      }
  },

  completeTicket: async (ticketId, data) => {
    const { showNotification } = get();
    const state = get();
    
    const updatedParts = state.parts.map(part => {
      const used = data.partsUsed.find(p => p.partId === part.id);
      if (used) {
        return { ...part, stock: Math.max(0, part.stock - used.quantity) };
      }
      return part;
    });

    const updatedTickets = state.tickets.map(t => 
      t.id === ticketId ? {
        ...t,
        status: 'RESOLVED' as const, // Changed from CLOSED to RESOLVED for Manager approval workflow
        formData: { ...t.formData, ...data.diagnosis },
        diagnosis: data.notes,
        updatedAt: new Date().toISOString(),
      } : t
    );

    set({ parts: updatedParts, tickets: updatedTickets });

    // Update status to RESOLVED waiting for manager confirmation
    const { error: tError } = await supabase.from('tickets').update({ 
        status: 'RESOLVED',
        diagnosis: data.notes
    }).eq('id', ticketId);
    
    if (tError) {
      showNotification('error', 'فشل تحديث البلاغ');
      return;
    }

    if (data.diagnosis && Object.keys(data.diagnosis).length > 0) {
      await supabase.from('ticket_form_data').insert({
        ticket_id: ticketId,
        form_data: data.diagnosis
      });
    }

    if (data.partsUsed.length > 0) {
       const transactions = data.partsUsed.map(p => ({
         part_id: p.partId,
         quantity_change: -p.quantity,
         transaction_type: 'OUT',
         ticket_id: ticketId,
         performed_by: state.user?.id
       }));
       
       await supabase.from('inventory_transactions').insert(transactions);

       for (const p of data.partsUsed) {
         const part = state.parts.find(i => i.id === p.partId);
         if (part) {
           const newStock = Math.max(0, part.stock - p.quantity);
           await supabase.from('spare_parts').update({ current_stock: newStock }).eq('id', p.partId);
         }
       }
    }
    showNotification('success', 'تم إنجاز العمل. بانتظار تأكيد المدير.');
  },

  fetchSystemMetadata: async () => {
    set({ isLoading: true });
    try {
      // 1. Config
      const { data: configData } = await supabase.from('system_config').select('key, value');
      if (configData) {
        const remoteConfig: any = { ...DEFAULT_CONFIG };
        configData.forEach(row => { remoteConfig[row.key] = row.value; });
        set(state => ({ config: { ...state.config, ...remoteConfig } }));
      }

      // 2. Schema
      const { data: schemaData } = await supabase.from('ui_schemas').select('schema_definition').eq('form_key', 'ticket_diagnosis').single();
      if (schemaData) {
        set({ ticketSchema: schemaData.schema_definition });
      }

      // 3. Permissions
      const { data: permData } = await supabase.from('role_permissions').select('*');
      if (permData) {
        const permMap: Record<string, boolean> = {};
        permData.forEach((p: any) => { permMap[`${p.role}:${p.permission_key}`] = p.is_allowed; });
        set({ permissions: permMap });
      }

      // 4. Assets
      const { data: assetsData, error: assetError } = await supabase.from('maintenance_assets').select('*');
      if (assetError) console.error("Asset Fetch Error:", assetError);
      if (assetsData) {
        const mappedAssets: Asset[] = assetsData.map((a: any) => ({
            id: a.id,
            name: a.name,
            serialNumber: a.serial_number,
            category: a.category,
            status: a.status || 'ACTIVE',
            purchaseDate: a.purchase_date || new Date().toISOString(),
            warrantyExpiry: a.warranty_expiry || new Date().toISOString(),
            supplier: a.supplier || 'Unknown',
            supplierContact: a.supplier_contact || '',
            initialValue: a.initial_value || 0,
            branchId: a.branch_id || 'b1',
            location: a.location || 'Main',
            healthScore: a.health_score || 100,
            image: a.image_url || 'https://via.placeholder.com/400'
        }));
        set({ assets: mappedAssets });
      }

      // 5. Tickets
      const { data: ticketsData } = await supabase.from('tickets').select('*');
      if (ticketsData) {
        const mappedTickets: Ticket[] = ticketsData.map((t: any) => ({
            id: t.id,
            title: t.title || 'بلاغ صيانة',
            description: t.description || '',
            assetId: t.asset_id,
            technicianId: t.technician_id,
            status: t.status,
            priority: t.priority,
            createdAt: t.created_at,
            updatedAt: t.updated_at || t.created_at,
            closedAt: t.closed_at,
            location: { lat: t.location_lat || 0, lng: t.location_lng || 0 },
            diagnosis: t.diagnosis
        }));
        set({ tickets: mappedTickets });
      }

      // 6. Parts
      const { data: partsData } = await supabase.from('spare_parts').select('*');
      if (partsData) {
        const mappedParts: Part[] = partsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          stock: p.current_stock,
          minStock: p.min_stock_level,
          price: p.price,
          image: p.image_url || 'https://via.placeholder.com/100'
        }));
        set({ parts: mappedParts });
      }

      // 7. Users
      const { data: profilesData } = await supabase.from('profiles').select('*');
      if (profilesData) {
          const mappedUsers: User[] = profilesData.map((p: any) => ({
              id: p.id,
              name: p.full_name || 'User',
              role: p.role as Role,
              avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name}&background=random`,
              branchId: p.branch_id
          }));
          set({ users: mappedUsers });
      }

    } catch (error) {
      console.error("Critical System Fetch Error:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveSystemConfig: async (newConfig: SystemConfig) => {
    const { showNotification } = get();
    set({ isLoading: true, config: newConfig }); 
    try {
      const updates = Object.entries(newConfig).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('system_config').upsert(updates);
      if (error) throw error;
      showNotification('success', 'تم حفظ الإعدادات');
    } catch (error: any) {
      showNotification('error', `فشل الحفظ: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  saveTicketSchema: async (newSchema: UISchema) => {
    const { showNotification } = get();
    set({ isLoading: true, ticketSchema: newSchema });
    try {
      const { error } = await supabase.from('ui_schemas').upsert({ form_key: 'ticket_diagnosis', schema_definition: newSchema }, { onConflict: 'form_key' });
      if (error) throw error;
      showNotification('success', 'تم تحديث النموذج');
    } catch (error: any) {
      showNotification('error', `فشل الحفظ: ${error.message}`);
    } finally {
      set({ isLoading: false });
    }
  },

  checkPermission: (key: string) => {
    const state = get();
    if (!state.user) return false;
    const matrixKey = `${state.user.role}:${key}`;
    return state.permissions[matrixKey] ?? false; 
  }
}));
