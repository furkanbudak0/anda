import { useState, useCallback, useMemo } from "react";
import {
  validationRules,
  validateField,
  validateForm,
  validationSchemas,
} from "../utils/validation";

/**
 * ENHANCED FORM VALIDATION HOOK
 *
 * Tekrarlanan form validation kodlarını elimine eden merkezi sistem.
 * Mevcut validation.js sistemini genişletir ve daha kullanışlı hale getirir.
 *
 * Özellikler:
 * - Real-time validation
 * - Multi-field validation
 * - Custom validation rules
 * - Form submission handling
 * - Error state management
 * - Field dirty state tracking
 * - Async validation support
 * - Form reset functionality
 */

/**
 * Enhanced form validation hook
 */
export function useFormValidation(initialData = {}, schema = {}, options = {}) {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    validateOnSubmit = true,
    resetOnSubmit = false,
    showErrorsOnSubmit = true,
  } = options;

  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Field validation helper
  const validateSingleField = useCallback(
    (fieldName, value) => {
      const fieldRules = schema[fieldName];
      if (!fieldRules) return null;

      return validateField(value, fieldRules);
    },
    [schema]
  );

  // Handle field value change
  const handleChange = useCallback(
    (fieldName, value) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // Clear error when user starts typing (if field was touched)
      if (touched[fieldName] && errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: null }));
      }

      // Validate on change if enabled
      if (validateOnChange && touched[fieldName]) {
        const error = validateSingleField(fieldName, value);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    },
    [touched, errors, validateOnChange, validateSingleField]
  );

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName) => {
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Validate on blur if enabled
      if (validateOnBlur) {
        const error = validateSingleField(fieldName, formData[fieldName]);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    },
    [validateOnBlur, validateSingleField, formData]
  );

  // Validate all fields
  const validateAll = useCallback(() => {
    const { isValid, errors: allErrors } = validateForm(formData, schema);

    if (showErrorsOnSubmit) {
      setErrors(allErrors);
    }

    // Mark all fields as touched
    const allTouched = Object.keys(schema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    return isValid;
  }, [formData, schema, showErrorsOnSubmit]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit) => {
      setIsSubmitting(true);
      setSubmitCount((prev) => prev + 1);

      try {
        if (validateOnSubmit && !validateAll()) {
          return false;
        }

        const result = await onSubmit(formData);

        if (resetOnSubmit) {
          reset();
        }

        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateOnSubmit, validateAll, resetOnSubmit]
  );

  // Reset form
  const reset = useCallback(
    (newData = null) => {
      setFormData(newData || initialData);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setSubmitCount(0);
    },
    [initialData]
  );

  // Set field error manually
  const setFieldError = useCallback((fieldName, error) => {
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  }, []);

  // Set multiple errors
  const setFormErrors = useCallback((newErrors) => {
    setErrors((prev) => ({ ...prev, ...newErrors }));
  }, []);

  // Update form data
  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Check if form is valid
  const isValid = useMemo(() => {
    return (
      Object.keys(errors).length === 0 ||
      Object.values(errors).every((error) => !error)
    );
  }, [errors]);

  // Check if form is dirty (has changes)
  const isDirty = useMemo(() => {
    return Object.keys(formData).some(
      (key) => formData[key] !== initialData[key]
    );
  }, [formData, initialData]);

  // Get field props for easier integration
  const getFieldProps = useCallback(
    (fieldName, options = {}) => {
      const { type = "text", validateOnChangeOverride = null } = options;

      return {
        value: formData[fieldName] || "",
        onChange: (e) => {
          const value = type === "checkbox" ? e.target.checked : e.target.value;
          handleChange(fieldName, value);

          // Override validation behavior if specified
          if (validateOnChangeOverride !== null && validateOnChangeOverride) {
            const error = validateSingleField(fieldName, value);
            setErrors((prev) => ({ ...prev, [fieldName]: error }));
          }
        },
        onBlur: () => handleBlur(fieldName),
        error: errors[fieldName],
        touched: touched[fieldName],
        name: fieldName,
      };
    },
    [formData, handleChange, handleBlur, errors, touched, validateSingleField]
  );

  return {
    // Form state
    formData,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValid,
    isDirty,

    // Form actions
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
    reset,
    updateFormData,

    // Error management
    setFieldError,
    setFormErrors,

    // Helper function
    getFieldProps,
  };
}

/**
 * Hook for multi-step forms
 */
export function useMultiStepForm(steps = [], initialData = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState(
    steps.reduce((acc, _, index) => {
      acc[index] = {};
      return acc;
    }, {})
  );
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Get current step configuration
  const currentStepConfig = steps[currentStep];

  // Form validation for current step
  const form = useFormValidation(
    { ...initialData, ...stepData[currentStep] },
    currentStepConfig?.schema || {},
    currentStepConfig?.options || {}
  );

  // Navigate to specific step
  const goToStep = useCallback(
    (stepIndex) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
      }
    },
    [steps.length]
  );

  // Go to next step
  const nextStep = useCallback(async () => {
    if (form.validateAll()) {
      // Save current step data
      setStepData((prev) => ({
        ...prev,
        [currentStep]: form.formData,
      }));

      // Mark step as completed
      setCompletedSteps((prev) => new Set([...prev, currentStep]));

      // Move to next step
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
        return true;
      }
    }
    return false;
  }, [form, currentStep, steps.length]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      // Save current step data
      setStepData((prev) => ({
        ...prev,
        [currentStep]: form.formData,
      }));

      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, form.formData]);

  // Get all form data
  const getAllData = useCallback(() => {
    const allData = { ...initialData };

    // Merge data from all steps
    Object.values(stepData).forEach((data) => {
      Object.assign(allData, data);
    });

    // Include current step data
    Object.assign(allData, form.formData);

    return allData;
  }, [initialData, stepData, form.formData]);

  // Check if we can proceed to next step
  const canProceed = form.isValid;

  // Check if this is the last step
  const isLastStep = currentStep === steps.length - 1;

  // Check if this is the first step
  const isFirstStep = currentStep === 0;

  return {
    // Current step info
    currentStep,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    canProceed,

    // Step management
    goToStep,
    nextStep,
    prevStep,

    // Form data
    form,
    getAllData,
    stepData,
    completedSteps,

    // Progress
    progress: ((currentStep + 1) / steps.length) * 100,
  };
}

/**
 * Hook for form with async validation
 */
export function useAsyncFormValidation(
  initialData = {},
  schema = {},
  asyncValidators = {}
) {
  const form = useFormValidation(initialData, schema);
  const [asyncErrors, setAsyncErrors] = useState({});
  const [validatingFields, setValidatingFields] = useState(new Set());

  // Validate field asynchronously
  const validateAsync = useCallback(
    async (fieldName, value) => {
      const validator = asyncValidators[fieldName];
      if (!validator) return;

      setValidatingFields((prev) => new Set([...prev, fieldName]));

      try {
        const error = await validator(value);
        setAsyncErrors((prev) => ({ ...prev, [fieldName]: error }));
      } catch (error) {
        setAsyncErrors((prev) => ({
          ...prev,
          [fieldName]: "Doğrulama sırasında hata oluştu",
        }));
      } finally {
        setValidatingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
      }
    },
    [asyncValidators]
  );

  // Enhanced handle change with async validation
  const handleAsyncChange = useCallback(
    (fieldName, value) => {
      form.handleChange(fieldName, value);

      // Clear async error
      if (asyncErrors[fieldName]) {
        setAsyncErrors((prev) => ({ ...prev, [fieldName]: null }));
      }

      // Debounced async validation
      const timeoutId = setTimeout(() => {
        validateAsync(fieldName, value);
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [form.handleChange, asyncErrors, validateAsync]
  );

  // Combined errors
  const allErrors = useMemo(() => {
    return { ...form.errors, ...asyncErrors };
  }, [form.errors, asyncErrors]);

  // Check if form is valid (including async)
  const isValidWithAsync = useMemo(() => {
    return (
      form.isValid &&
      Object.values(asyncErrors).every((error) => !error) &&
      validatingFields.size === 0
    );
  }, [form.isValid, asyncErrors, validatingFields]);

  return {
    ...form,
    errors: allErrors,
    isValid: isValidWithAsync,
    handleChange: handleAsyncChange,
    validatingFields,
    validateAsync,
  };
}

/**
 * Pre-configured form hooks for common use cases
 */

// Contact form hook
export function useContactForm() {
  return useFormValidation(
    {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    validationSchemas.contact,
    {
      validateOnBlur: true,
      validateOnSubmit: true,
    }
  );
}

// Address form hook
export function useAddressForm(initialData = {}) {
  return useFormValidation(
    {
      address_name: "",
      full_name: "",
      phone: "",
      address_line: "",
      district: "",
      city: "",
      postal_code: "",
      ...initialData,
    },
    validationSchemas.address
  );
}

// Payment method form hook
export function usePaymentMethodForm(initialData = {}) {
  return useFormValidation(
    {
      card_name: "",
      card_number: "",
      card_holder_name: "",
      expiry_month: "",
      expiry_year: "",
      cvv: "",
      ...initialData,
    },
    validationSchemas.paymentMethod
  );
}

// Review form hook
export function useReviewForm() {
  return useFormValidation(
    {
      rating: 0,
      title: "",
      comment: "",
    },
    validationSchemas.review
  );
}

export default useFormValidation;
