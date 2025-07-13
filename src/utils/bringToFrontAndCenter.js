import { useState, useRef, useEffect, useCallback } from "react";

/**
 * BRING TO FRONT AND CENTER UTILITY
 *
 * Modern z-index management and auto-centering system for modals, dialogs, and dropdowns.
 * Ensures all overlays are properly layered and focused with accessibility support.
 *
 * Features:
 * - Auto-incrementing z-index management
 * - Automatic centering for modals and dialogs
 * - Focus management and keyboard navigation
 * - Escape key handling
 * - Multiple overlay support
 * - Accessibility compliance
 */

// Base z-index values for different UI layers
const Z_INDEX_BASE = {
  DROPDOWN: 1000,
  TOOLTIP: 1100,
  MODAL: 1200,
  NOTIFICATION: 1300,
  EMERGENCY: 1400,
};

// Global state for managing active overlays
class OverlayManager {
  constructor() {
    this.activeOverlays = new Set();
    this.maxZIndex = Math.max(...Object.values(Z_INDEX_BASE));
    this.focusStack = [];
    this.escapeHandlers = new Map();

    // Global escape key listener
    this.setupGlobalEscapeHandler();
  }

  // Setup global escape key handling
  setupGlobalEscapeHandler() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        // Call the most recent escape handler
        const handlers = Array.from(this.escapeHandlers.values());
        const topHandler = handlers[handlers.length - 1];
        if (topHandler) {
          e.preventDefault();
          topHandler();
        }
      }
    });
  }

  // Get next available z-index
  getNextZIndex(type = "MODAL") {
    const baseIndex = Z_INDEX_BASE[type] || Z_INDEX_BASE.MODAL;
    this.maxZIndex = Math.max(this.maxZIndex + 10, baseIndex);
    return this.maxZIndex;
  }

  // Register a new overlay
  registerOverlay(id, options = {}) {
    const overlay = {
      id,
      zIndex: this.getNextZIndex(options.type),
      type: options.type || "MODAL",
      element: options.element,
      onClose: options.onClose,
      restoreFocus: options.restoreFocus !== false,
      preventBodyScroll: options.preventBodyScroll !== false,
      ...options,
    };

    this.activeOverlays.add(overlay);

    // Store current focus to restore later
    if (overlay.restoreFocus) {
      this.focusStack.push(document.activeElement);
    }

    // Prevent body scroll for modals
    if (overlay.preventBodyScroll && overlay.type === "MODAL") {
      document.body.style.overflow = "hidden";
    }

    // Register escape handler
    if (overlay.onClose) {
      this.escapeHandlers.set(id, overlay.onClose);
    }

    return overlay;
  }

  // Unregister an overlay
  unregisterOverlay(id) {
    const overlay = Array.from(this.activeOverlays).find((o) => o.id === id);
    if (!overlay) return;

    this.activeOverlays.delete(overlay);
    this.escapeHandlers.delete(id);

    // Restore focus if needed
    if (overlay.restoreFocus && this.focusStack.length > 0) {
      const previousElement = this.focusStack.pop();
      if (previousElement && previousElement.focus) {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => previousElement.focus(), 0);
      }
    }

    // Restore body scroll if no modals are active
    const hasActiveModals = Array.from(this.activeOverlays).some(
      (o) => o.type === "MODAL"
    );
    if (!hasActiveModals) {
      document.body.style.overflow = "";
    }
  }

  // Bring overlay to front
  bringToFront(id) {
    const overlay = Array.from(this.activeOverlays).find((o) => o.id === id);
    if (!overlay) return;

    // Update z-index to be highest
    overlay.zIndex = this.getNextZIndex(overlay.type);

    // Update DOM element if available
    if (overlay.element) {
      overlay.element.style.zIndex = overlay.zIndex;
    }

    return overlay.zIndex;
  }

  // Get all active overlays sorted by z-index
  getActiveOverlays() {
    return Array.from(this.activeOverlays).sort((a, b) => a.zIndex - b.zIndex);
  }

  // Close all overlays
  closeAll() {
    const overlays = Array.from(this.activeOverlays);
    overlays.forEach((overlay) => {
      if (overlay.onClose) {
        overlay.onClose();
      }
    });
  }

  // Close top overlay
  closeTop() {
    const overlays = this.getActiveOverlays();
    const topOverlay = overlays[overlays.length - 1];
    if (topOverlay?.onClose) {
      topOverlay.onClose();
    }
  }
}

// Global overlay manager instance
const overlayManager = new OverlayManager();

/**
 * Main utility functions
 */

// Create a bring-to-front overlay configuration
export function createOverlayConfig(id, options = {}) {
  return overlayManager.registerOverlay(id, options);
}

// Remove overlay configuration
export function removeOverlayConfig(id) {
  overlayManager.unregisterOverlay(id);
}

// Bring specific overlay to front
export function bringToFront(id) {
  return overlayManager.bringToFront(id);
}

// Get overlay styles for React components
export function getOverlayStyles(id, options = {}) {
  const overlay = overlayManager.registerOverlay(id, options);

  const baseStyles = {
    position: "fixed",
    zIndex: overlay.zIndex,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  // Center content for modals and dialogs
  if (options.type === "MODAL" || options.center) {
    return {
      ...baseStyles,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    };
  }

  return baseStyles;
}

// Get backdrop styles
export function getBackdropStyles(options = {}) {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: options.backgroundColor || "rgba(0, 0, 0, 0.5)",
    opacity: options.opacity || 1,
    transition: "opacity 200ms ease-in-out",
  };
}

// Focus management utilities
export function trapFocus(element) {
  if (!element) return () => {};

  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  element.addEventListener("keydown", handleTabKey);

  // Focus first element
  if (firstElement) {
    setTimeout(() => firstElement.focus(), 0);
  }

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleTabKey);
  };
}

// React hook for bring-to-front functionality
export function useBringToFrontAndCenter(id, options = {}) {
  const [overlay, setOverlay] = useState(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (options.isOpen) {
      const overlayConfig = createOverlayConfig(id, {
        ...options,
        element: elementRef.current,
      });
      setOverlay(overlayConfig);

      // Setup focus trap if element is available
      let cleanupFocus;
      if (elementRef.current && options.trapFocus !== false) {
        cleanupFocus = trapFocus(elementRef.current);
      }

      return () => {
        if (cleanupFocus) cleanupFocus();
        removeOverlayConfig(id);
      };
    } else {
      removeOverlayConfig(id);
      setOverlay(null);
    }
  }, [id, options.isOpen]);

  const bringToFrontHandler = useCallback(() => {
    if (overlay) {
      return bringToFront(id);
    }
  }, [id, overlay]);

  return {
    overlay,
    elementRef,
    bringToFront: bringToFrontHandler,
    styles: overlay ? getOverlayStyles(id, options) : {},
  };
}

// CSS class generators for Tailwind
export function getOverlayClasses(type = "MODAL", options = {}) {
  const baseClasses = "fixed inset-0";

  let typeClasses = "";
  switch (type) {
    case "DROPDOWN":
      typeClasses = "z-[1000]";
      break;
    case "TOOLTIP":
      typeClasses = "z-[1100]";
      break;
    case "MODAL":
      typeClasses = "z-[1200] flex items-center justify-center p-4";
      break;
    case "NOTIFICATION":
      typeClasses = "z-[1300]";
      break;
    case "EMERGENCY":
      typeClasses = "z-[1400]";
      break;
    default:
      typeClasses = "z-[1200]";
  }

  if (options.center && type !== "MODAL") {
    typeClasses += " flex items-center justify-center p-4";
  }

  return `${baseClasses} ${typeClasses}`;
}

// Utility to close all overlays (emergency use)
export function closeAllOverlays() {
  overlayManager.closeAll();
}

// Utility to close top overlay
export function closeTopOverlay() {
  overlayManager.closeTop();
}

// Export overlay manager for advanced usage
export { overlayManager };

// Default export with main functions
export default {
  createOverlayConfig,
  removeOverlayConfig,
  bringToFront,
  getOverlayStyles,
  getBackdropStyles,
  trapFocus,
  useBringToFrontAndCenter,
  getOverlayClasses,
  closeAllOverlays,
  closeTopOverlay,
  overlayManager,
};
