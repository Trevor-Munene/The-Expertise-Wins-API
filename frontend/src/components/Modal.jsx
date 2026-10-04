// frontend/src/components/Modal.jsx
"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// Track open modals so only the topmost modal handles keyboard events.
const openModals = [];
let previousBodyOverflow = "";

export default function Modal({ isOpen, onClose, title, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;

    if (openModals.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    openModals.push(dialog);

    const isTopmost = () =>
      openModals[openModals.length - 1] === dialog;

    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll(focusableSelector)).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.closest("[inert]") &&
          element.getAttribute("aria-hidden") !== "true"
      );

    const focusFirstElement = () => {
      const firstElement = getFocusableElements()[0];
      (firstElement || dialog).focus({ preventScroll: true });
    };

    const handleKeyDown = (event) => {
      if (!isTopmost()) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement) || activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleFocusIn = (event) => {
      if (isTopmost() && !dialog.contains(event.target)) {
        focusFirstElement();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    focusFirstElement();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);

      const wasTopmost = isTopmost();
      const index = openModals.indexOf(dialog);

      if (index !== -1) {
        openModals.splice(index, 1);
      }

      if (openModals.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }

      if (wasTopmost) {
        const remainingDialog = openModals[openModals.length - 1];
        const canRestoreFocus =
          previousFocus instanceof HTMLElement &&
          previousFocus.isConnected &&
          (!remainingDialog || remainingDialog.contains(previousFocus));

        if (canRestoreFocus) {
          previousFocus.focus({ preventScroll: true });
        } else if (remainingDialog) {
          remainingDialog.focus({ preventScroll: true });
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          openModals[openModals.length - 1] === dialogRef.current
        ) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Dialog"}
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl outline-none"
      >
        {/* Modal header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className="min-w-0 break-words text-lg font-bold text-slate-100"
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal content */}
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}