// frontend/src/components/ToastProvider.jsx

"use client";

import { Toaster } from "react-hot-toast";

const toastBackground = "var(--toast-background, #0f172a)";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80,
        left: 16,
        right: 16,
      }}
      toastOptions={{
        duration: 4000,

        ariaProps: {
          role: "status",
          "aria-live": "polite",
        },

        style: {
          background: toastBackground,
          color: "var(--toast-foreground, #f1f5f9)",
          border: "1px solid var(--toast-border, #334155)",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          fontSize: "14px",
          lineHeight: "1.5",
          maxWidth: "min(420px, calc(100vw - 32px))",
          overflowWrap: "anywhere",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
        },

        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: toastBackground,
          },
        },

        error: {
          iconTheme: {
            primary: "#f43f5e",
            secondary: toastBackground,
          },
        },
      }}
    />
  );
}