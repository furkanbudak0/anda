/* eslint-disable react/prop-types */
import { useId } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  useBringToFrontAndCenter,
  getOverlayClasses,
} from "../utils/bringToFrontAndCenter";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Onayla",
  cancelText = "İptal",
  isProcessing = false,
  danger = false,
}) => {
  const modalId = useId();

  // Bring to front and center hook
  const { elementRef } = useBringToFrontAndCenter(modalId, {
    isOpen,
    type: "MODAL",
    onClose,
    center: true,
    trapFocus: true,
    preventBodyScroll: true,
    restoreFocus: true,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={elementRef}
      className={getOverlayClasses("MODAL")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalId}-title`}
      aria-describedby={`${modalId}-description`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-200 scale-100">
        {/* Modal Body */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Warning Icon */}
            {danger && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            )}

            {/* Content */}
            <div className={`flex-1 ${!danger ? "text-center" : ""}`}>
              <h3
                id={`${modalId}-title`}
                className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                {title}
              </h3>
              <div
                id={`${modalId}-description`}
                className="text-gray-600 dark:text-gray-300"
              >
                {children}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              aria-label="Kapat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              danger
                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "bg-brand-600 hover:bg-brand-700 focus:ring-brand-500"
            } ${isProcessing ? "opacity-75 cursor-wait" : ""}`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
