import { supabase } from './supabase';

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function signUpUser(email: string, password: string) 
{
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}
