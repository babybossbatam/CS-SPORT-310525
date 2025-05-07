import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://mnqugjhbztzbkkvifzie.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
