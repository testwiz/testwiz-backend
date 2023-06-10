import { createClient } from '@supabase/supabase-js';

require('dotenv').config();

export const SupaBaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
