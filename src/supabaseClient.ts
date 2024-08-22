import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase.js'
import CONFIG from "./appConfig.js";

// Create a single supabase client for interacting with your database
const supabase = createClient<Database>(
   CONFIG.SUPABASE_URL,
   CONFIG.SUPABASE_KEY
);

export default supabase;