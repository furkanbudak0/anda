import {
  useMutation as useReactQueryMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useErrorHandling } from "./useErrorHandling";

/**
 * MERKEZI MUTATION HOOK SİSTEMİ
 *
 * React Query mutation pattern tekrarlarını tek bir yerde toplayan merkezi sistem.
 * Tüm mutation'lar için tutarlı error handling, success feedback ve cache invalidation.
 *
 * Özellikler:
 * - Automatic error handling
 * - Success notifications
 * - Cache invalidation
 * - Loading states
 * - Retry functionality
 * - Optimistic updates
 */

/**
 * Standard mutation hook with built-in error handling and success feedback
 */
export function useMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();
  const { mutationErrorHandler } = useErrorHandling();

  const {
    // Success options
    successMessage = null,
    onSuccess = null,

    // Error options
    errorMessage = null,
    onError = null,

    // Cache options
    invalidateQueries = [],
    removeQueries = [],
    refetchQueries = [],

    // Loading options
    loadingMessage = null,

    // Other options
    showToast = true,
    mutationKey = null,
    context = "Mutation",
    ...mutationOptions
  } = options;

  return useReactQueryMutation({
    mutationKey,
    mutationFn,
    onMutate: async (variables) => {
      // Show loading toast if specified
      if (loadingMessage && showToast) {
        toast.loading(loadingMessage, { id: mutationKey || "mutation" });
      }

      // Call custom onMutate if provided
      if (mutationOptions.onMutate) {
        return await mutationOptions.onMutate(variables);
      }
    },
    onSuccess: async (data, variables, context) => {
      // Dismiss loading toast
      if (loadingMessage && showToast) {
        toast.dismiss(mutationKey || "mutation");
      }

      // Show success toast
      if (successMessage && showToast) {
        toast.success(successMessage);
      }

      // Invalidate specified queries
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }

      // Remove specified queries
      if (removeQueries.length > 0) {
        removeQueries.forEach((queryKey) =>
          queryClient.removeQueries({ queryKey })
        );
      }

      // Refetch specified queries
      if (refetchQueries.length > 0) {
        await Promise.all(
          refetchQueries.map((queryKey) =>
            queryClient.refetchQueries({ queryKey })
          )
        );
      }

      // Call custom onSuccess if provided
      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Dismiss loading toast
      if (loadingMessage && showToast) {
        toast.dismiss(mutationKey || "mutation");
      }

      // Handle error with centralized handler
      mutationErrorHandler(
        error,
        context,
        mutationOptions.retry ? () => mutationFn(variables) : null
      );

      // Show custom error message if provided
      if (errorMessage && showToast) {
        toast.error(errorMessage);
      }

      // Call custom onError if provided
      if (onError) {
        onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}

/**
 * Create mutation hook - for creating new resources
 */
export function useCreateMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    successMessage: "Başarıyla oluşturuldu",
    context: "Create",
    ...options,
  });
}

/**
 * Update mutation hook - for updating existing resources
 */
export function useUpdateMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    successMessage: "Başarıyla güncellendi",
    context: "Update",
    ...options,
  });
}

/**
 * Delete mutation hook - for deleting resources
 */
export function useDeleteMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    successMessage: "Başarıyla silindi",
    errorMessage: "Silme işlemi başarısız",
    context: "Delete",
    ...options,
  });
}

/**
 * Bulk mutation hook - for bulk operations
 */
export function useBulkMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    successMessage: "Toplu işlem başarıyla tamamlandı",
    loadingMessage: "İşlem yapılıyor...",
    context: "Bulk Operation",
    ...options,
  });
}

/**
 * Form submission mutation hook
 */
export function useFormMutation(mutationFn, options = {}) {
  const {
    resetForm = null,
    closeModal = null,
    redirectTo = null,
    ...mutationOptions
  } = options;

  return useMutation(mutationFn, {
    successMessage: "Form başarıyla gönderildi",
    context: "Form Submission",
    onSuccess: async (data, variables, context) => {
      // Reset form if function provided
      if (resetForm) {
        resetForm();
      }

      // Close modal if function provided
      if (closeModal) {
        closeModal();
      }

      // Redirect if path provided
      if (redirectTo && typeof window !== "undefined") {
        if (typeof redirectTo === "function") {
          const path = redirectTo(data);
          window.location.href = path;
        } else {
          window.location.href = redirectTo;
        }
      }

      // Call custom onSuccess
      if (mutationOptions.onSuccess) {
        await mutationOptions.onSuccess(data, variables, context);
      }
    },
    ...mutationOptions,
  });
}

/**
 * File upload mutation hook
 */
export function useUploadMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    successMessage: "Dosya başarıyla yüklendi",
    loadingMessage: "Dosya yükleniyor...",
    context: "File Upload",
    ...options,
  });
}

/**
 * Authentication mutation hooks
 */
export function useAuthMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    context: "Authentication",
    showToast: false, // Auth mutations usually handle their own notifications
    ...options,
  });
}

/**
 * Admin action mutation hook
 */
export function useAdminMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    context: "Admin Action",
    loadingMessage: "İşlem yapılıyor...",
    ...options,
  });
}

/**
 * Seller action mutation hook
 */
export function useSellerMutation(mutationFn, options = {}) {
  return useMutation(mutationFn, {
    context: "Seller Action",
    invalidateQueries: [["seller-products"], ["seller-orders"]],
    ...options,
  });
}

/**
 * Optimistic update mutation hook
 */
export function useOptimisticMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient();

  const { queryKey, updateFn, ...mutationOptions } = options;

  return useMutation(mutationFn, {
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache
      if (updateFn) {
        queryClient.setQueryData(queryKey, updateFn(previousData, variables));
      }

      // Return context with previous data
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey });
    },
    ...mutationOptions,
  });
}

/**
 * Batch mutations hook - for running multiple mutations
 */
export function useBatchMutations() {
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandling();

  const executeBatch = async (mutations, options = {}) => {
    const {
      showProgress = true,
      stopOnError = false,
      invalidateQueries = [],
    } = options;

    const results = [];
    let toastId = null;

    try {
      if (showProgress) {
        toastId = toast.loading(`İşlem 0/${mutations.length}`);
      }

      for (let i = 0; i < mutations.length; i++) {
        try {
          if (showProgress) {
            toast.loading(`İşlem ${i + 1}/${mutations.length}`, {
              id: toastId,
            });
          }

          const result = await mutations[i]();
          results.push({ success: true, data: result });
        } catch (error) {
          results.push({ success: false, error });

          if (stopOnError) {
            throw error;
          }
        }
      }

      // Invalidate queries after all mutations
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey })
          )
        );
      }

      if (showProgress) {
        toast.success("Tüm işlemler tamamlandı", { id: toastId });
      }

      return results;
    } catch (error) {
      if (showProgress) {
        toast.error("İşlem başarısız", { id: toastId });
      }

      handleError(error, "Batch Mutations");
      throw error;
    }
  };

  return { executeBatch };
}

/**
 * Helper function to create mutation options
 */
export function createMutationOptions(type, resourceName, options = {}) {
  const baseOptions = {
    create: {
      successMessage: `${resourceName} başarıyla oluşturuldu`,
      context: `Create ${resourceName}`,
    },
    update: {
      successMessage: `${resourceName} başarıyla güncellendi`,
      context: `Update ${resourceName}`,
    },
    delete: {
      successMessage: `${resourceName} başarıyla silindi`,
      context: `Delete ${resourceName}`,
    },
  };

  return {
    ...baseOptions[type],
    ...options,
  };
}
