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
          background: "#0f172a",
          color: "#f8fafc",
          border: "1px solid #334155",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#0f172a",
          },
        },
        error: {
          iconTheme: {
            primary: "#f43f5e",
            secondary: "#0f172a",
          },
        },
      }}
    />
  );
}
