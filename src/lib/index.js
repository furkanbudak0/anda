/**
 * MERKEZI LIBRARY EXPORT SİSTEMİ
 *
 * Tekrarlanan import statement'ları elimine eden merkezi export sistemi.
 * Tüm yaygın kullanılan kütüphaneler ve utility'ler tek bir yerden export edilir.
 */

// React & Hooks
export {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useReducer,
  useImperativeHandle,
  useLayoutEffect,
  forwardRef,
  memo,
  createContext,
  lazy,
  Suspense,
  Fragment,
  StrictMode,
} from "react";

// React Query
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useIsMutating,
} from "@tanstack/react-query";

// Heroicons (most commonly used)
export {
  // Navigation
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon,

  // Actions
  PlusIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,

  // Status
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,

  // UI Elements
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  BellIcon,

  // User & Account
  UserIcon,
  UserCircleIcon,
  UserGroupIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,

  // Shopping
  ShoppingCartIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  BanknotesIcon,
  GiftIcon,

  // Communication
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  ChatBubbleOvalLeftIcon,

  // Media
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  ClipboardDocumentIcon,

  // Misc
  HeartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  CurrencyDollarIcon,
  TagIcon,
  FireIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export {
  // Solid versions of commonly used icons
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UserIcon as UserIconSolid,
  HomeIcon as HomeIconSolid,
} from "@heroicons/react/24/solid";

// Framer Motion
export {
  motion,
  AnimatePresence,
  useAnimation,
  useSpring,
  useTransform,
  useScroll,
  useMotionValue,
  useViewportScroll,
} from "framer-motion";

// React Hot Toast
export { default as toast } from "react-hot-toast";

// Utility Functions
export {
  formatDate,
  formatPrice,
  formatCurrency,
  formatPercentage,
  formatNumber,
  truncateText,
  getInitials,
  generateId,
  debounce,
  throttle,
  classNames,
} from "../utils/formatters";

// Validation
export {
  validationRules,
  validateField,
  validateForm,
  validationSchemas,
} from "../utils/validation";

// Local Services
export { supabase } from "../services/supabase";
export * as apiAuth from "../services/apiAuth";
export * as apiProducts from "../services/apiProducts";
export * as apiSellers from "../services/apiSellers";

// Context Providers
export { useAuth } from "../contexts/AuthContext";
export { useCart } from "../contexts/CartContext";
export { useTheme } from "../contexts/ThemeContext";

// Custom Hooks
export { default as useFormValidation } from "../hooks/useFormValidation";
export { default as useDebounce } from "../hooks/useDebounce";
export { useProducts } from "../hooks/useProducts";
export { useReviews } from "../hooks/useReviews";
export { useWishlist } from "../hooks/useWishlist";
export { useAuth as useAuthHook } from "../hooks/useAuth";

// Enhanced Hooks (new centralized ones)
export { useErrorHandling } from "../hooks/useErrorHandling";
export { useMutation as useEnhancedMutation } from "../hooks/useMutation";
export { useLoading } from "../hooks/useLoading";

// UI Components
export {
  Modal,
  ModalButton,
  FormModal,
  ConfirmationModal,
} from "../components/ui";
export { default as Spinner } from "../components/Spinner";
export { default as EmptyState } from "../components/EmptyState";
export { default as LoadingFallback } from "../components/LoadingFallback";

// Constants
export { PRODUCT_CATEGORIES } from "../constants/categories";

// Common Props Types (for TypeScript-like prop validation)
export const CommonPropTypes = {
  children: "node",
  className: "string",
  onClick: "func",
  loading: "bool",
  disabled: "bool",
  variant: "oneOf",
  size: "oneOf",
};
