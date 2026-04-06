import { ReactNode } from 'react';

export function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen relative">
        {children}
      </div>
    </div>
  );
}
