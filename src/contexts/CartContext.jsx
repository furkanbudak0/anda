/* eslint-disable react/prop-types */
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import { supabase } from "../services/supabase";

/**
 * Enhanced Shopping Cart Context with advanced features
 * - Cart abandonment tracking
 * - Stock validation
 * - Auto-save functionality
 * - Multiple item addition detection
 * - Seller notes support
 */

// Cart Actions
const CART_ACTIONS = {
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_QUANTITY: "UPDATE_QUANTITY",
  CLEAR_CART: "CLEAR_CART",
  APPLY_COUPON: "APPLY_COUPON",
  REMOVE_COUPON: "REMOVE_COUPON",
  SET_SHIPPING: "SET_SHIPPING",
  SET_BILLING: "SET_BILLING",
  LOAD_CART: "LOAD_CART",
  SET_SELLER_NOTE: "SET_SELLER_NOTE",
  TRACK_ABANDONMENT: "TRACK_ABANDONMENT",
  SET_STOCK_NOTIFICATION: "SET_STOCK_NOTIFICATION",
};

// Initial state
const initialState = {
  items: [],
  coupon: null,
  shippingAddress: null,
  billingAddress: null,
  shippingMethod: null,
  paymentMethod: null,
  sellerNotes: {}, // {sellerId: "note"}
  stockNotifications: [], // Products user wants to be notified about
  lastActivity: Date.now(),
  reminderSent: false,
  multipleAdditionCount: 0,
};

// Cart reducer
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const {
        product,
        quantity = 1,
        variantId = null,
        skipStockCheck = false,
      } = action.payload;

      // Check stock availability first
      if (
        !skipStockCheck &&
        product.quantity !== undefined &&
        product.quantity < quantity
      ) {
        toast.error(
          "Yeterli stok bulunmuyor! Stok bilgisi gelince bildirim almak ister misiniz?",
          {
            duration: 5000,
            action: {
              label: "Bildirim Al",
              onClick: () => {
                // Add to stock notifications
                toast.success("Stok bildirim listesine eklendi!");
              },
            },
          }
        );
        return {
          ...state,
          stockNotifications: [
            ...state.stockNotifications.filter((id) => id !== product.id),
            product.id,
          ],
        };
      }

      // Create unique item key based on product ID and variant ID
      const itemKey = variantId ? `${product.id}-${variantId}` : product.id;

      const existingItemIndex = state.items.findIndex(
        (item) => item.key === itemKey
      );

      let newState;

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Check max quantity limit (stock available)
        const maxQuantity = product.quantity || 999;
        if (newQuantity > maxQuantity) {
          toast.error(`Maximum ${maxQuantity} adet ekleyebilirsiniz`);
          return state;
        }

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };

        newState = {
          ...state,
          items: updatedItems,
          lastActivity: Date.now(),
          multipleAdditionCount: state.multipleAdditionCount + 1,
        };
      } else {
        // Add new item
        const newItem = {
          key: itemKey,
          id: product.id,
          variantId,
          name: product.name,
          price: product.price,
          discountedPrice: product.discounted_price,
          image: product.image_url,
          seller: product.seller?.business_name || "Satıcı",
          sellerId: product.seller_id,
          quantity,
          maxQuantity: product.quantity || 999,
          slug: product.slug,
          addedAt: Date.now(),
        };

        newState = {
          ...state,
          items: [...state.items, newItem],
          lastActivity: Date.now(),
          multipleAdditionCount: state.multipleAdditionCount + 1,
        };
      }

      // Show multiple addition message if user added multiple items quickly
      if (newState.multipleAdditionCount > 1) {
        const recentAdditions = state.items.filter(
          (item) => Date.now() - item.addedAt < 30000 // 30 seconds
        ).length;

        if (recentAdditions >= 2) {
          toast("1'den fazla ürün mü almak istiyorsunuz?", {
            icon: "🛒",
            duration: 4000,
          });
        }
      }

      return newState;
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter(
          (item) => item.key !== action.payload.itemKey
        ),
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemKey, quantity } = action.payload;

      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.key !== itemKey),
          lastActivity: Date.now(),
        };
      }

      const updatedItems = state.items.map((item) => {
        if (item.key === itemKey) {
          // Check max quantity limit
          if (quantity > (item.maxQuantity || 999)) {
            toast.error(
              `Maximum ${item.maxQuantity || 999} adet ekleyebilirsiniz`
            );
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems,
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.CLEAR_CART: {
      return {
        ...initialState,
        stockNotifications: state.stockNotifications, // Keep stock notifications
      };
    }

    case CART_ACTIONS.APPLY_COUPON: {
      return {
        ...state,
        coupon: action.payload,
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.REMOVE_COUPON: {
      return {
        ...state,
        coupon: null,
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.SET_SHIPPING: {
      return {
        ...state,
        shippingAddress: action.payload.address,
        shippingMethod: action.payload.method,
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.SET_BILLING: {
      return {
        ...state,
        billingAddress: action.payload.address,
        paymentMethod: action.payload.method,
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.SET_SELLER_NOTE: {
      const { sellerId, note } = action.payload;
      return {
        ...state,
        sellerNotes: {
          ...state.sellerNotes,
          [sellerId]: note,
        },
        lastActivity: Date.now(),
      };
    }

    case CART_ACTIONS.SET_STOCK_NOTIFICATION: {
      const { productId, enabled } = action.payload;
      const updatedNotifications = enabled
        ? [
            ...state.stockNotifications.filter((id) => id !== productId),
            productId,
          ]
        : state.stockNotifications.filter((id) => id !== productId);

      return {
        ...state,
        stockNotifications: updatedNotifications,
      };
    }

    case CART_ACTIONS.TRACK_ABANDONMENT: {
      return {
        ...state,
        reminderSent: action.payload.reminderSent,
        lastActivity: action.payload.lastActivity || state.lastActivity,
      };
    }

    case CART_ACTIONS.LOAD_CART: {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}

// Create context
const CartContext = createContext();

// Cart Provider component
export function CartProvider({ children }) {
  const [cartState, dispatch] = useReducer(cartReducer, initialState);
  const abandonmentTimerRef = useRef(null);
  const lastUserRef = useRef(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("anda_cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({
          type: CART_ACTIONS.LOAD_CART,
          payload: parsedCart,
        });
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        localStorage.removeItem("anda_cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (
      cartState.items.length > 0 ||
      Object.keys(cartState.sellerNotes).length > 0
    ) {
      localStorage.setItem("anda_cart", JSON.stringify(cartState));
    } else {
      localStorage.removeItem("anda_cart");
    }
  }, [cartState]);

  // Track cart abandonment
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.id !== lastUserRef.current) {
        lastUserRef.current = user.id;

        // Save cart abandonment tracking to database
        if (cartState.items.length > 0) {
          await saveCartAbandonmentTracking(user.id, cartState);
        }
      }
    };

    checkUser();
  }, [cartState.items]);

  // Set up abandonment reminder timer
  useEffect(() => {
    if (cartState.items.length > 0 && !cartState.reminderSent) {
      // Clear existing timer
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
      }

      // Set 10-minute timer for cart abandonment reminder
      abandonmentTimerRef.current = setTimeout(() => {
        if (cartState.items.length > 0 && !cartState.reminderSent) {
          showAbandonmentReminder();
          dispatch({
            type: CART_ACTIONS.TRACK_ABANDONMENT,
            payload: { reminderSent: true },
          });
        }
      }, 10 * 60 * 1000); // 10 minutes
    }

    return () => {
      if (abandonmentTimerRef.current) {
        clearTimeout(abandonmentTimerRef.current);
      }
    };
  }, [cartState.items.length, cartState.reminderSent]);

  // Save cart abandonment tracking to database
  const saveCartAbandonmentTracking = async (userId, cart) => {
    try {
      const cartTotal = calculateTotal();

      await supabase.from("cart_abandonment_tracking").upsert({
        user_id: userId,
        cart_items: cart.items,
        cart_total: cartTotal,
        last_activity: new Date().toISOString(),
        reminder_sent: cart.reminderSent || false,
      });
    } catch (error) {
      console.error("Error saving cart abandonment tracking:", error);
    }
  };

  // Show cart abandonment reminder
  const showAbandonmentReminder = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <div className="font-medium text-gray-900">
            Sepetinizi tamamlamak ister misiniz?
          </div>
          <div className="text-sm text-gray-600">
            Sepetinizde {cartState.items.length} ürün bekliyor
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                window.location.href = "/cart";
                toast.dismiss(t.id);
              }}
              className="bg-brand-600 text-white px-3 py-1 rounded text-sm hover:bg-brand-700"
            >
              Sepete Git
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        icon: "🛒",
      }
    );
  };

  // Validate stock before checkout
  const validateCartStock = async () => {
    const stockValidation = [];

    for (const item of cartState.items) {
      try {
        const { data: product } = await supabase
          .from("products")
          .select("quantity, name")
          .eq("id", item.id)
          .single();

        if (product) {
          if (product.quantity < item.quantity) {
            stockValidation.push({
              item,
              availableStock: product.quantity,
              requestedQuantity: item.quantity,
            });
          }
        }
      } catch (error) {
        console.error("Error validating stock for item:", item.id, error);
      }
    }

    return stockValidation;
  };

  // Action functions
  const addItem = async (product, quantity = 1, variantId = null) => {
    // Check if user is logged in for cart operations
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sepete ürün eklemek için giriş yapmalısınız!", {
        action: {
          label: "Giriş Yap",
          onClick: () => (window.location.href = "/auth"),
        },
      });
      return false;
    }

    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { product, quantity, variantId },
    });

    toast.success(`${product.name} sepete eklendi!`);
    return true;
  };

  const removeItem = (itemKey) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: { itemKey },
    });
    toast.success("Ürün sepetten kaldırıldı");
  };

  const updateQuantity = (itemKey, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { itemKey, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    toast.success("Sepet temizlendi");
  };

  const applyCoupon = (coupon) => {
    dispatch({
      type: CART_ACTIONS.APPLY_COUPON,
      payload: coupon,
    });
    toast.success(`${coupon.code} kuponu uygulandı!`);
  };

  const removeCoupon = () => {
    dispatch({ type: CART_ACTIONS.REMOVE_COUPON });
    toast.success("Kupon kaldırıldı");
  };

  const setShipping = (address, method) => {
    dispatch({
      type: CART_ACTIONS.SET_SHIPPING,
      payload: { address, method },
    });
  };

  const setBilling = (address, method) => {
    dispatch({
      type: CART_ACTIONS.SET_BILLING,
      payload: { address, method },
    });
  };

  const setSellerNote = (sellerId, note) => {
    dispatch({
      type: CART_ACTIONS.SET_SELLER_NOTE,
      payload: { sellerId, note },
    });
  };

  const setStockNotification = (productId, enabled) => {
    dispatch({
      type: CART_ACTIONS.SET_STOCK_NOTIFICATION,
      payload: { productId, enabled },
    });

    if (enabled) {
      toast.success("Stok bildirim listesine eklendi!");
    } else {
      toast.success("Stok bildiriminden kaldırıldı");
    }
  };

  // Calculation functions
  const calculateSubtotal = () => {
    return cartState.items.reduce((total, item) => {
      const price = item.discountedPrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!cartState.coupon) return 0;

    const subtotal = calculateSubtotal();
    let discount = 0;

    if (cartState.coupon.type === "percentage") {
      discount = (subtotal * cartState.coupon.value) / 100;
    } else if (cartState.coupon.type === "fixed") {
      discount = cartState.coupon.value;
    }

    // Apply max discount limit if exists
    if (cartState.coupon.maxDiscount) {
      discount = Math.min(discount, cartState.coupon.maxDiscount);
    }

    return discount;
  };

  const calculateShipping = () => {
    // Free shipping for orders over threshold
    const subtotal = calculateSubtotal();
    const freeShippingThreshold = 500; // 500 TL

    if (subtotal >= freeShippingThreshold) {
      return 0;
    }

    // Calculate shipping by seller
    const sellerGroups = {};
    cartState.items.forEach((item) => {
      if (!sellerGroups[item.sellerId]) {
        sellerGroups[item.sellerId] = [];
      }
      sellerGroups[item.sellerId].push(item);
    });

    // Base shipping cost per seller
    const shippingPerSeller = 29.99;
    return Object.keys(sellerGroups).length * shippingPerSeller;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const shipping = calculateShipping();

    return Math.max(0, subtotal - discount + shipping);
  };

  // Group items by seller for checkout
  const getItemsBySeller = () => {
    const sellerGroups = {};

    cartState.items.forEach((item) => {
      if (!sellerGroups[item.sellerId]) {
        sellerGroups[item.sellerId] = {
          sellerId: item.sellerId,
          sellerName: item.seller,
          items: [],
          note: cartState.sellerNotes[item.sellerId] || "",
        };
      }
      sellerGroups[item.sellerId].items.push(item);
    });

    return Object.values(sellerGroups);
  };

  // Context value
  const contextValue = {
    // State
    items: cartState.items,
    itemCount: cartState.items.reduce(
      (count, item) => count + item.quantity,
      0
    ),
    coupon: cartState.coupon,
    shippingAddress: cartState.shippingAddress,
    billingAddress: cartState.billingAddress,
    shippingMethod: cartState.shippingMethod,
    paymentMethod: cartState.paymentMethod,
    sellerNotes: cartState.sellerNotes,
    stockNotifications: cartState.stockNotifications,

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setShipping,
    setBilling,
    setSellerNote,
    setStockNotification,

    // Calculations
    subtotal: calculateSubtotal(),
    discount: calculateDiscount(),
    shipping: calculateShipping(),
    total: calculateTotal(),

    // Utils
    getItemsBySeller,
    validateCartStock,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
