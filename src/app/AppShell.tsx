import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-ambient text-fg font-sans overflow-x-hidden relative">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 relative z-10 space-y-6 min-[1400px]:max-w-none min-[1400px]:px-6">
        {children}
      </div>
    </div>
  );
}
