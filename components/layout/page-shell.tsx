export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-shell px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {children}
    </main>
  );
}
