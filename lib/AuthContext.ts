import { supabase } from './supabase';

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error) return { error: 'Invalid credentials' };
  return { user: data };
}

export async function signUpUser(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'Username already exists' };
    return { error: error.message };
  }

  return { user: data };
}
