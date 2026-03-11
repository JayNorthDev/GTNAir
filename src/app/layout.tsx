
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/layout/app-layout';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'GTNPlay',
  description: 'Unlock a World of Entertainment',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppLayout defaultOpen={defaultOpen}>
          {children}
        </AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
