import type { Metadata } from 'next';
import { IBM_Plex_Sans, Schibsted_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import { StorageWarning } from '@/components/layout/storage-warning';
import { ThemeScript } from '@/components/layout/theme-script';
import './globals.css';

const display = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SkillProof',
  description:
    'Turn a student profile into a measurable readiness score and an adaptive roadmap backed by evidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${display.variable} ${body.variable} font-sans text-ui antialiased`}>
        <StorageWarning />
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: 'font-sans text-ui-sm' }} />
      </body>
    </html>
  );
}
