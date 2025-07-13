import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * ÇOK PARA BİRİMİ (MULTI-CURRENCY) SİSTEMİ
 *
 * Özellikler:
 * - Real-time döviz kurları
 * - Otomatik para birimi algılama
 * - Fiyat dönüştürme
 * - Para birimi formatlaması
 * - Cache'li kur verileri
 * - Fallback mekanizması
 */

// Desteklenen para birimleri
const SUPPORTED_CURRENCIES = {
  TRY: {
    code: "TRY",
    symbol: "₺",
    name: "Türk Lirası",
    position: "after", // before or after
    decimals: 2,
    isDefault: true,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    position: "before",
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    position: "before",
    decimals: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    position: "before",
    decimals: 2,
  },
  SAR: {
    code: "SAR",
    symbol: "﷼",
    name: "Saudi Riyal",
    position: "after",
    decimals: 2,
  },
  AED: {
    code: "AED",
    symbol: "د.إ",
    name: "UAE Dirham",
    position: "after",
    decimals: 2,
  },
};

// Context
const CurrencyContext = createContext();

/**
 * Multi-currency hook
 */
export function useMultiCurrency() {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem("anda_currency") || "TRY";
  });

  // Döviz kurlarını fetch et
  const {
    data: exchangeRates,
    isLoading: ratesLoading,
    error: ratesError,
  } = useQuery({
    queryKey: ["exchange-rates", selectedCurrency],
    queryFn: async () => {
      try {
        // Real API integration (örnek: Fixer.io, CurrencyAPI, vs.)
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/TRY`
        );
        const data = await response.json();

        // Cache'e kaydet
        localStorage.setItem(
          "anda_exchange_rates",
          JSON.stringify({
            rates: data.rates,
            timestamp: Date.now(),
          })
        );

        return data.rates;
      } catch (error) {
        console.error("Exchange rates fetch failed:", error);

        // Fallback: cached rates
        const cached = localStorage.getItem("anda_exchange_rates");
        if (cached) {
          const { rates, timestamp } = JSON.parse(cached);
          // Use cached rates if less than 1 hour old
          if (Date.now() - timestamp < 60 * 60 * 1000) {
            return rates;
          }
        }

        // Ultimate fallback: static rates
        return {
          TRY: 1,
          USD: 0.034,
          EUR: 0.031,
          GBP: 0.027,
          SAR: 0.128,
          AED: 0.125,
        };
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  // Para birimi değiştirme
  const changeCurrency = (currencyCode) => {
    if (SUPPORTED_CURRENCIES[currencyCode]) {
      setSelectedCurrency(currencyCode);
      localStorage.setItem("anda_currency", currencyCode);
    }
  };

  // Fiyat dönüştürme
  const convertPrice = (priceInTRY, targetCurrency = selectedCurrency) => {
    if (!exchangeRates || !priceInTRY) return 0;

    if (targetCurrency === "TRY") return priceInTRY;

    const rate = exchangeRates[targetCurrency];
    if (!rate) return priceInTRY;

    return priceInTRY * rate;
  };

  // Fiyat formatlama
  const formatPrice = (priceInTRY, currencyCode = selectedCurrency) => {
    const currency = SUPPORTED_CURRENCIES[currencyCode];
    if (!currency) return `${priceInTRY} TRY`;

    const convertedPrice = convertPrice(priceInTRY, currencyCode);
    const formatted = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(convertedPrice);

    if (currency.position === "before") {
      return `${currency.symbol}${formatted}`;
    } else {
      return `${formatted}${currency.symbol}`;
    }
  };

  // Kullanıcının bulunduğu ülkeye göre para birimi önerisi
  const suggestedCurrency = useQuery({
    queryKey: ["suggested-currency"],
    queryFn: async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        const countryToCurrency = {
          TR: "TRY",
          US: "USD",
          GB: "GBP",
          DE: "EUR",
          FR: "EUR",
          IT: "EUR",
          ES: "EUR",
          SA: "SAR",
          AE: "AED",
          // Add more mappings
        };

        return countryToCurrency[data.country_code] || "TRY";
      } catch (error) {
        return "TRY";
      }
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Auto-detect currency on first visit
  useEffect(() => {
    const hasSelectedCurrency = localStorage.getItem("anda_currency");
    const hasSeenSuggestion = localStorage.getItem("anda_currency_suggested");

    if (!hasSelectedCurrency && !hasSeenSuggestion && suggestedCurrency.data) {
      if (suggestedCurrency.data !== "TRY") {
        // Show currency suggestion modal/notification
        localStorage.setItem("anda_currency_suggested", "true");
      }
    }
  }, [suggestedCurrency.data]);

  return {
    // Current state
    selectedCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    exchangeRates,
    isLoading: ratesLoading,
    error: ratesError,
    suggestedCurrency: suggestedCurrency.data,

    // Actions
    changeCurrency,
    convertPrice,
    formatPrice,

    // Utilities
    getCurrencyInfo: (code) => SUPPORTED_CURRENCIES[code],
    isSupported: (code) => !!SUPPORTED_CURRENCIES[code],
  };
}

/**
 * Currency Provider Component
 */
export function CurrencyProvider({ children }) {
  const currencyData = useMultiCurrency();

  return (
    <CurrencyContext.Provider value={currencyData}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Use currency context
 */
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

/**
 * Currency Selector Component
 */
export function CurrencySelector({ className = "" }) {
  const { selectedCurrency, supportedCurrencies, changeCurrency } =
    useCurrency();

  return (
    <select
      value={selectedCurrency}
      onChange={(e) => changeCurrency(e.target.value)}
      className={`border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
    >
      {Object.values(supportedCurrencies).map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.symbol} {currency.code}
        </option>
      ))}
    </select>
  );
}

/**
 * Price component with currency conversion
 */
export function Price({
  amount,
  currency = "TRY",
  className = "",
  showOriginal = false,
  originalCurrency = "TRY",
}) {
  const { formatPrice, selectedCurrency, convertPrice } = useCurrency();

  if (showOriginal && selectedCurrency !== originalCurrency) {
    return (
      <div className={className}>
        <span className="font-semibold">
          {formatPrice(amount, selectedCurrency)}
        </span>
        <span className="text-sm text-gray-500 ml-2">
          ({formatPrice(amount, originalCurrency)})
        </span>
      </div>
    );
  }

  return (
    <span className={className}>{formatPrice(amount, selectedCurrency)}</span>
  );
}

/**
 * Currency suggestion notification hook
 */
export function useCurrencySuggestion() {
  const { suggestedCurrency, selectedCurrency, changeCurrency } = useCurrency();
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    const hasSeenSuggestion = localStorage.getItem("anda_currency_suggested");

    if (
      suggestedCurrency &&
      suggestedCurrency !== selectedCurrency &&
      !hasSeenSuggestion
    ) {
      setShowSuggestion(true);
    }
  }, [suggestedCurrency, selectedCurrency]);

  const acceptSuggestion = () => {
    changeCurrency(suggestedCurrency);
    dismissSuggestion();
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
    localStorage.setItem("anda_currency_suggested", "true");
  };

  return {
    showSuggestion,
    suggestedCurrency,
    acceptSuggestion,
    dismissSuggestion,
  };
}
