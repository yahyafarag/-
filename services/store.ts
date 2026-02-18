import { create } from 'zustand';
import { User, Ticket, Asset, Part, SystemConfig, UISchema } from '../types';
import { MOCK_USERS, MOCK_ASSETS, MOCK_TICKETS, MOCK_PARTS, DEFAULT_CONFIG, DEFAULT_TICKET_SCHEMA } from '../constants';

interface AppState {
  user: User | null;
  users: User[];
  assets: Asset[];
  tickets: Ticket[];
  parts: Part[];
  config: SystemConfig;
  ticketSchema: UISchema;
  
  // Actions
  login: (userId: string) => void;
  logout: () => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  updateConfig: (config: Partial<SystemConfig>) => void;
  updateTicketSchema: (schema: UISchema) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null, // Start logged out
  users: MOCK_USERS,
  assets: MOCK_ASSETS,
  tickets: MOCK_TICKETS,
  parts: MOCK_PARTS,
  config: DEFAULT_CONFIG,
  ticketSchema: DEFAULT_TICKET_SCHEMA,

  login: (userId: string) => set((state) => ({
    user: state.users.find(u => u.id === userId) || null
  })),

  logout: () => set({ user: null }),

  addTicket: (ticket: Ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets]
  })),

  updateTicket: (id: string, updates: Partial<Ticket>) => set((state) => ({
    tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  updateAsset: (id: string, updates: Partial<Asset>) => set((state) => ({
    assets: state.assets.map(a => a.id === id ? { ...a, ...updates } : a)
  })),

  updateConfig: (newConfig: Partial<SystemConfig>) => set((state) => ({
    config: { ...state.config, ...newConfig }
  })),

  updateTicketSchema: (schema: UISchema) => set({ ticketSchema: schema }),
}));