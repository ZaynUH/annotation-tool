import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserContextType 
{
  user: User | null; // The authenticated user (if any)
  setUser: (user: User | null) => void; // Function to update user state
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => 
{
  const [user, setUser] = useState<User | null>(null); // State to hold the current user

  useEffect(() => 
  {
    // On mount, get the current auth session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    // Listen to future auth state changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => 
    {
      setUser(session?.user ?? null);
    });

    // Cleanup listener on unmount
    return () => 
    {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the user context in components
export const useUser = () => 
{
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
};
