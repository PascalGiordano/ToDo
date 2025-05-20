
'use client'; // Required for useTheme hook

import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';

const geistSans = GeistSans;
const geistMono = GeistMono;

// Si des métadonnées statiques sont nécessaires, elles doivent être gérées
// différemment pour les composants clients, par exemple via un composant serveur parent.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme, isThemeInitialized } = useTheme();

  // This useEffect is to ensure the class is applied after client-side hydration
  // and theme initialization to avoid mismatch if SSR doesn't know the theme.
  useEffect(() => {
    if (isThemeInitialized) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isThemeInitialized]);

  // Apply a placeholder class or no class until theme is initialized to prevent FOUC
  const themeClass = isThemeInitialized ? theme : '';

  return (
    <html lang="en" className={themeClass} suppressHydrationWarning>
      <head>
        {/* Vous pouvez ajouter des balises meta statiques ici si nécessaire,
            bien que l'approche Next.js 'metadata' soit généralement préférée
            et devrait être configurée dans un composant serveur si possible.
            Pour cet exercice, nous corrigeons l'erreur immédiate. */}
        <title>TaskFlow</title>
        <meta name="description" content="Manage your tasks efficiently with TaskFlow." />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
