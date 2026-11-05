"use client";

import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";
import { useShopStore } from "@/lib/store";

export default function ToastViewport() {
  const toasts = useShopStore((s) => s.toasts);
  const dismissToast = useShopStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-60 flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const icon =
          toast.tone === "error" ? (
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
          ) : toast.tone === "info" ? (
            <Info size={18} className="text-blue-500 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/95 text-white shadow-2xl border border-white/10 backdrop-blur-md transition-all"
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold tracking-wide">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
