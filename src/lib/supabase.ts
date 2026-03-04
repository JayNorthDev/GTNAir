
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zphjbdzjkgbmezwzcora.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaGpiZHpqa2dibWV6d3pjb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTA2NzQsImV4cCI6MjA4ODIyNjY3NH0.7qBjW8pLlnjnRCMj7atlgoAS66ckkMLWEKomM5Xh7Y4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
