import type { Metadata } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from 'sonner';
import { StorageWarning } from '@/components/layout/storage-warning';
import { ThemeScript } from '@/components/layout/theme-script';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillProof',
  description:
    'Turn a student profile into a measurable readiness score and an adaptive roadmap backed by evidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="font-sans text-base antialiased">
        <StorageWarning />
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: 'font-sans text-sm' }} />
      </body>
    </html>
  );
}
