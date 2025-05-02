// pages/_app.tsx
import type { AppProps } from 'next/app';
import { AnnotationProvider } from '../context/AnnotationContext';
import { UserProvider } from '../context/UserContext'; 
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <AnnotationProvider>
        <Component {...pageProps} />
      </AnnotationProvider>
    </UserProvider>
  );
}
