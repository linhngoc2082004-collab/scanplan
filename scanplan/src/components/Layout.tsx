import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-[400px] px-6 py-8">
        {children}
      </div>
    </div>
  );
}