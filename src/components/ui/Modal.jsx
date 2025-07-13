/* eslint-disable react/prop-types */
import { useId, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  useBringToFrontAndCenter,
  getOverlayClasses,
} from "../../utils/bringToFrontAndCenter";

/**
 * Universal Modal Component
 * Replaces all duplicated modal structures across the app
 *
 * Features:
 * - Unified styling and behavior
 * - Accessible by default
 * - Dark mode support
 * - Focus management
 * - Escape key handling
 * - Customizable sizes and styles
 */

// Modal size variants
const sizeVariants = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full mx-4",
};

// Modal variants
const variants = {
  default: "bg-white dark:bg-gray-800",
  danger: "bg-white dark:bg-gray-800",
  success: "bg-white dark:bg-gray-800",
  warning: "bg-white dark:bg-gray-800",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  variant = "default",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  scrollable = true,
  className = "",
  titleIcon,
  headerContent,
  ...props
}) {
  const modalId = useId();

  // Bring to front and center hook
  const { elementRef } = useBringToFrontAndCenter(`modal-${modalId}`, {
    isOpen,
    type: "MODAL",
    onClose: closeOnEscape ? onClose : null,
    center: true,
    trapFocus: true,
    preventBodyScroll: true,
    restoreFocus: true,
  });

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      ref={elementRef}
      className={getOverlayClasses("MODAL")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
      aria-describedby={`${modalId}-description`}
      onClick={handleBackdropClick}
      {...props}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`
          relative transform transition-all duration-200 scale-100 w-full
          ${sizeVariants[size]}
          ${variants[variant]}
          rounded-2xl shadow-2xl
          ${scrollable ? "max-h-[90vh] overflow-hidden" : ""}
          ${className}
        `}
      >
        {/* Header */}
        {(title || headerContent || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  {titleIcon}
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <h3
                    id={`${modalId}-title`}
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h3>
                )}
                {headerContent}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Kapat"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          id={`${modalId}-description`}
          className={`
            p-6
            ${scrollable ? "overflow-y-auto" : ""}
            ${!title && !headerContent && !showCloseButton ? "pt-6" : ""}
            ${!footer ? "pb-6" : ""}
          `}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal Action Button Component
 * For consistent footer buttons
 */
export function ModalButton({
  children,
  variant = "default",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) {
  const variantStyles = {
    default:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    ghost:
      "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${loading ? "opacity-75 cursor-wait" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          İşleniyor...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Confirmation Modal - specialized modal for confirmations
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Emin misiniz?",
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  variant = "danger",
  loading = false,
  ...props
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <ModalButton variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </ModalButton>
          <ModalButton variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </ModalButton>
        </>
      }
      {...props}
    >
      {message && (
        <div className="text-gray-600 dark:text-gray-300">{message}</div>
      )}
    </Modal>
  );
}

/**
 * Form Modal - specialized modal for forms
 */
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Kaydet",
  cancelText = "İptal",
  submitDisabled = false,
  loading = false,
  ...props
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <ModalButton variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </ModalButton>
          <ModalButton
            variant="primary"
            type="submit"
            form={`form-modal-${title?.replace(/\s+/g, "-")}`}
            loading={loading}
            disabled={submitDisabled}
          >
            {submitText}
          </ModalButton>
        </>
      }
      {...props}
    >
      <form
        id={`form-modal-${title?.replace(/\s+/g, "-")}`}
        onSubmit={handleSubmit}
      >
        {children}
      </form>
    </Modal>
  );
}
