/* eslint-disable react/prop-types */
import { forwardRef } from "react";
import { motion } from "framer-motion";

/**
 * Modern, accessible button component with multiple variants
 * Based on modern UI/UX patterns with motion support
 */

// Button variant styles
const getVariantStyles = (variant) => {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700 focus-visible:ring-blue-500",
    secondary:
      "border-2 border-gray-300 bg-white text-gray-900 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    success:
      "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:from-emerald-600 hover:to-green-700 focus-visible:ring-emerald-500",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500",
    warning:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 focus-visible:ring-amber-500",
    ghost:
      "hover:bg-gray-100 focus-visible:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-100",
    link: "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 dark:text-blue-400",
    outline:
      "border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus-visible:ring-blue-500 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-gray-900",
  };
  return variants[variant] || variants.primary;
};

// Button size styles
const getSizeStyles = (size) => {
  const sizes = {
    xs: "h-8 px-3 text-xs gap-1",
    sm: "h-9 px-4 text-sm gap-2",
    md: "h-10 px-6 text-sm gap-2",
    lg: "h-12 px-8 text-base gap-3",
    xl: "h-14 px-10 text-lg gap-3",
    icon: "h-10 w-10",
    "icon-sm": "h-8 w-8",
    "icon-lg": "h-12 w-12",
  };
  return sizes[size] || sizes.md;
};

const Button = forwardRef(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled = false,
      children,
      leftIcon,
      rightIcon,
      motionProps,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Combine all classes
    const buttonClasses = [
      // Base styles
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50 select-none",
      // Variant styles
      getVariantStyles(variant),
      // Size styles
      getSizeStyles(size),
      // Full width
      fullWidth ? "w-full" : "w-auto",
      // Loading cursor
      loading ? "cursor-not-allowed" : "",
      // Custom classes
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const buttonContent = (
      <>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children && (
          <span className={loading ? "opacity-0" : ""}>{children}</span>
        )}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </>
    );

    // Motion wrapper for animations
    if (motionProps || (!isDisabled && !loading)) {
      return (
        <motion.button
          ref={ref}
          className={buttonClasses}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.02 } : undefined}
          whileTap={!isDisabled ? { scale: 0.98 } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          {...motionProps}
          {...props}
        >
          {buttonContent}
        </motion.button>
      );
    }

    // Standard button without motion
    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = "Button";

// Pre-configured button variants
export const PrimaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));
SecondaryButton.displayName = "SecondaryButton";

export const SuccessButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="success" {...props} />
));
SuccessButton.displayName = "SuccessButton";

export const DangerButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="danger" {...props} />
));
DangerButton.displayName = "DangerButton";

export const WarningButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="warning" {...props} />
));
WarningButton.displayName = "WarningButton";

export const GhostButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="ghost" {...props} />
));
GhostButton.displayName = "GhostButton";

export const LinkButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="link" {...props} />
));
LinkButton.displayName = "LinkButton";

export const OutlineButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="outline" {...props} />
));
OutlineButton.displayName = "OutlineButton";

// Icon button variants
export const IconButton = forwardRef(({ size = "icon", ...props }, ref) => (
  <Button ref={ref} size={size} {...props} />
));
IconButton.displayName = "IconButton";

// Loading button
export const LoadingButton = forwardRef(({ loading = true, ...props }, ref) => (
  <Button ref={ref} loading={loading} {...props} />
));
LoadingButton.displayName = "LoadingButton";

export default Button;
