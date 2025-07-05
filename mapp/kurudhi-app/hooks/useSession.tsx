import React from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/constants/FirebaseConfig'; // Adjust the import path as needed

const auth = getAuth(app);

export const SessionContext = React.createContext<{
  session: User | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true,
});

export function useSession() {
  const value = React.useContext(SessionContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <SessionProvider />');
    }
  }
  return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
  const [session, setSession] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setSession(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {props.children}
    </SessionContext.Provider>
  );
}
