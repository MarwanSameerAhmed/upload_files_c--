import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://iolxekjzhdlcpjruqzxv.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHhla2p6aGRsY3BqcnVxenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMzQwOTcsImV4cCI6MjEwNzkxMDA5N30.m8fqbEJGxeSSHuX8HjxvW0r1sW1BqGw9joPRVRRJP6I';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);
انا