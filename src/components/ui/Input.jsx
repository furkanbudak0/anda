/* eslint-disable react/prop-types */
import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Modern, accessible input component with validation states
 */

// Input variant styles
const getVariantStyles = (variant, hasError, hasSuccess) => {
  if (hasError) {
    return "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400";
  }
  if (hasSuccess) {
    return "border-green-500 focus:border-green-500 focus:ring-green-500 dark:border-green-400";
  }

  const variants = {
    default:
      "border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400",
    filled:
      "bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:focus:bg-gray-800",
    minimal:
      "border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 focus:ring-0 dark:border-gray-600",
  };
  return variants[variant] || variants.default;
};

// Input size styles
const getSizeStyles = (size) => {
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-4 text-base",
  };
  return sizes[size] || sizes.md;
};

const Input = forwardRef(
  (
    {
      className = "",
      type = "text",
      variant = "default",
      size = "md",
      label,
      placeholder,
      helperText,
      error,
      success,
      required = false,
      disabled = false,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      onToggleVisibility,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === "password";
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success);
    const actualType = isPassword && showPassword ? "text" : type;

    // Input classes
    const inputClasses = [
      // Base styles
      "w-full rounded-lg transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400",
      "focus:outline-none focus:ring-2 focus:ring-offset-0",
      "disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60",
      "dark:bg-gray-800 dark:text-white",
      // Variant and state styles
      getVariantStyles(variant, hasError, hasSuccess),
      // Size styles
      getSizeStyles(size),
      // Icon padding adjustments
      leftIcon || leftAddon ? "pl-10" : "",
      rightIcon || rightAddon || isPassword ? "pr-10" : "",
      // Custom classes
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Container classes
    const containerClasses = ["relative", disabled ? "opacity-60" : ""]
      .filter(Boolean)
      .join(" ");

    // Label classes
    const labelClasses = [
      "block text-sm font-medium mb-2 transition-colors",
      hasError
        ? "text-red-600 dark:text-red-400"
        : "text-gray-700 dark:text-gray-300",
      required ? "after:content-['*'] after:text-red-500 after:ml-1" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
      onToggleVisibility?.(!showPassword);
    };

    const inputElement = (
      <input
        ref={ref}
        type={actualType}
        className={inputClasses}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
    );

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label className={labelClasses} htmlFor={props.id}>
            {label}
          </label>
        )}

        {/* Input Container */}
        <motion.div
          className={containerClasses}
          initial={false}
          animate={{
            scale: isFocused ? 1.01 : 1,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          }}
        >
          {/* Left Addon */}
          {leftAddon && (
            <div className="absolute inset-y-0 left-0 flex items-center">
              <span className="bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg px-3 h-full flex items-center text-gray-500 dark:text-gray-400 text-sm">
                {leftAddon}
              </span>
            </div>
          )}

          {/* Left Icon */}
          {leftIcon && !leftAddon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400 dark:text-gray-500">{leftIcon}</div>
            </div>
          )}

          {/* Input */}
          {inputElement}

          {/* Right Icons/Addons */}
          <div className="absolute inset-y-0 right-0 flex items-center">
            {/* Success Icon */}
            {hasSuccess && !hasError && (
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
            )}

            {/* Error Icon */}
            {hasError && (
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-3" />
            )}

            {/* Password Toggle */}
            {isPassword && (
              <button
                type="button"
                className="mr-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={handleTogglePassword}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Right Icon */}
            {rightIcon && !isPassword && !hasError && !hasSuccess && (
              <div className="mr-3 text-gray-400 dark:text-gray-500 pointer-events-none">
                {rightIcon}
              </div>
            )}

            {/* Right Addon */}
            {rightAddon && (
              <div className="flex items-center">
                <span className="bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg px-3 h-full flex items-center text-gray-500 dark:text-gray-400 text-sm">
                  {rightAddon}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Helper Text / Error / Success Message */}
        {(helperText || error || success) && (
          <div className="mt-2 flex items-start">
            {hasError && (
              <ExclamationCircleIcon className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
            )}
            {hasSuccess && !hasError && (
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
            )}
            {!hasError && !hasSuccess && helperText && (
              <InformationCircleIcon className="w-4 h-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${
                hasError
                  ? "text-red-600 dark:text-red-400"
                  : hasSuccess
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {error || success || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Pre-configured input variants
export const DefaultInput = forwardRef((props, ref) => (
  <Input ref={ref} variant="default" {...props} />
));
DefaultInput.displayName = "DefaultInput";

export const FilledInput = forwardRef((props, ref) => (
  <Input ref={ref} variant="filled" {...props} />
));
FilledInput.displayName = "FilledInput";

export const MinimalInput = forwardRef((props, ref) => (
  <Input ref={ref} variant="minimal" {...props} />
));
MinimalInput.displayName = "MinimalInput";

// Specialized input types
export const PasswordInput = forwardRef((props, ref) => (
  <Input ref={ref} type="password" {...props} />
));
PasswordInput.displayName = "PasswordInput";

export const EmailInput = forwardRef((props, ref) => (
  <Input ref={ref} type="email" {...props} />
));
EmailInput.displayName = "EmailInput";

export const NumberInput = forwardRef((props, ref) => (
  <Input ref={ref} type="number" {...props} />
));
NumberInput.displayName = "NumberInput";

export const SearchInput = forwardRef((props, ref) => (
  <Input ref={ref} type="search" {...props} />
));
SearchInput.displayName = "SearchInput";

export default Input;
