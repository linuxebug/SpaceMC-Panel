import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Processing..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-card/80 backdrop-blur-sm">
      <div className="bg-card border border-border p-6 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.3)]xl flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        <p className="text-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

