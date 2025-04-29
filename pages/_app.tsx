// pages/_app.tsx
import type { AppProps } from 'next/app';
import { AnnotationProvider } from '../context/AnnotationContext';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AnnotationProvider>
      <Component {...pageProps} />
    </AnnotationProvider>
  );
}
