import React, { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface NotificationBannerProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
  autoDismissMs?: number;
}

export default function NotificationBanner({
  message,
  type = "success",
  onClose,
  autoDismissMs = 8000
}: NotificationBannerProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoDismissMs);

    return () => {
      clearTimeout(timer);
    };
  }, [message, onClose, autoDismissMs]);

  if (!message) return null;

  return (
    <div
      className={`p-4 rounded-r-xl flex items-start space-x-3 shadow-md animate-fade-in border-l-4 transition-all ${
        type === "success"
          ? "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-100"
          : "bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-950/80 dark:text-rose-100"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`text-xs font-bold font-mono cursor-pointer transition-colors p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${
          type === "success"
            ? "text-emerald-500 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-100"
            : "text-rose-500 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-100"
        }`}
        aria-label="Fermer la notification"
      >
        ✕
      </button>
    </div>
  );
}
