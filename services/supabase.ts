import { createClient } from '@supabase/supabase-js';

// Configuration for Supabase Connection
// Project: hxbmvkigmcprbaxpnoas

// Safely access env variables, defaulting to empty object if not present (to avoid crash)
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hxbmvkigmcprbaxpnoas.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4Ym12a2lnbWNwcmJheHBub2FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MzY0MDUsImV4cCI6MjA4NzAxMjQwNX0.blDjzyxU30EVv9sZwj8iu7PA1w_Yb84uC843cNV4y7c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);