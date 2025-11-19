// src/app/(auth)/signup/layout.tsx
import React from 'react';

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md p-4 relative z-10">
      {children}
    </div>
  );
}