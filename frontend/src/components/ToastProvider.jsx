// frontend/src/components/ToastProvider.jsx

"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,

        style: {
          background: "var(--toast-background)",
          color: "var(--toast-foreground)",
          border: "1px solid var(--toast-border)",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          fontSize: "14px",
        },

        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "var(--toast-background)",
          },
        },

        error: {
          iconTheme: {
            primary: "#f43f5e",
            secondary: "var(--toast-background)",
          },
        },
      }}
    />
  );
}