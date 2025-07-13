import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

/**
 * COMPREHENSIVE INSTALLMENT SYSTEM
 *
 * Features:
 * - Bank-specific installment options
 * - Real-time installment calculations
 * - Interest rate management
 * - Zero-interest installment campaigns
 * - Monthly payment calculations
 * - Credit card compatibility checks
 */

/**
 * Available banks and their installment options
 */
export const BANK_INSTALLMENT_OPTIONS = {
  ziraat: {
    name: "Ziraat Bankası",
    code: "ziraat",
    logo: "/banks/ziraat.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 2.89, campaignText: "6 Taksit" },
      { count: 9, interestRate: 3.24, campaignText: "9 Taksit" },
      { count: 12, interestRate: 3.49, campaignText: "12 Taksit" },
    ],
  },
  akbank: {
    name: "Akbank",
    code: "akbank",
    logo: "/banks/akbank.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 1.89, campaignText: "6 Taksit" },
      { count: 9, interestRate: 2.24, campaignText: "9 Taksit" },
      { count: 12, interestRate: 2.49, campaignText: "12 Taksit" },
    ],
  },
  garanti: {
    name: "Garanti BBVA",
    code: "garanti",
    logo: "/banks/garanti.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 1.99, campaignText: "6 Taksit" },
      { count: 9, interestRate: 2.39, campaignText: "9 Taksit" },
      { count: 12, interestRate: 2.69, campaignText: "12 Taksit" },
    ],
  },
  isbank: {
    name: "İş Bankası",
    code: "isbank",
    logo: "/banks/isbank.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 2.09, campaignText: "6 Taksit" },
      { count: 9, interestRate: 2.44, campaignText: "9 Taksit" },
      { count: 12, interestRate: 2.79, campaignText: "12 Taksit" },
    ],
  },
  yapikredi: {
    name: "Yapı Kredi",
    code: "yapikredi",
    logo: "/banks/yapikredi.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 1.79, campaignText: "6 Taksit" },
      { count: 9, interestRate: 2.19, campaignText: "9 Taksit" },
      { count: 12, interestRate: 2.59, campaignText: "12 Taksit" },
    ],
  },
  halkbank: {
    name: "Halkbank",
    code: "halkbank",
    logo: "/banks/halkbank.png",
    installments: [
      { count: 2, interestRate: 0, campaignText: "2 Taksit %0 Faiz" },
      { count: 3, interestRate: 0, campaignText: "3 Taksit %0 Faiz" },
      { count: 6, interestRate: 2.19, campaignText: "6 Taksit" },
      { count: 9, interestRate: 2.59, campaignText: "9 Taksit" },
      { count: 12, interestRate: 2.89, campaignText: "12 Taksit" },
    ],
  },
};

/**
 * Hook for calculating installment options for a given amount
 */
export function useInstallmentCalculation(amount, selectedBank = null) {
  return useQuery({
    queryKey: ["installment-calculation", amount, selectedBank],
    queryFn: async () => {
      if (!amount || amount <= 0) return [];

      const banksToCalculate = selectedBank
        ? [BANK_INSTALLMENT_OPTIONS[selectedBank]]
        : Object.values(BANK_INSTALLMENT_OPTIONS);

      const calculations = banksToCalculate.map((bank) => {
        const installmentOptions = bank.installments.map((option) => {
          const monthlyInterestRate = option.interestRate / 100 / 12;
          let monthlyPayment;
          let totalAmount;

          if (option.interestRate === 0) {
            // Zero interest
            monthlyPayment = amount / option.count;
            totalAmount = amount;
          } else {
            // With interest
            const compoundInterest = Math.pow(
              1 + monthlyInterestRate,
              option.count
            );
            monthlyPayment =
              (amount * monthlyInterestRate * compoundInterest) /
              (compoundInterest - 1);
            totalAmount = monthlyPayment * option.count;
          }

          return {
            ...option,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            totalAmount: Math.round(totalAmount * 100) / 100,
            totalInterest: Math.round((totalAmount - amount) * 100) / 100,
            savings:
              option.interestRate === 0
                ? 0
                : Math.round((totalAmount - amount) * 100) / 100,
          };
        });

        return {
          ...bank,
          installmentOptions,
        };
      });

      return calculations;
    },
    enabled: !!amount && amount > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for getting active installment campaigns
 */
export function useInstallmentCampaigns() {
  return useQuery({
    queryKey: ["installment-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installment_campaigns")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw new Error("Kampanyalar yüklenemedi");
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for creating installment orders
 */
export function useCreateInstallmentOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderData, installmentData }) => {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw new Error("Sipariş oluşturulamadı");

      // Create installment record
      const { data: installment, error: installmentError } = await supabase
        .from("order_installments")
        .insert({
          order_id: order.id,
          bank_name: installmentData.bankName,
          installment_count: installmentData.installmentCount,
          monthly_amount: installmentData.monthlyAmount,
          total_amount: installmentData.totalAmount,
          interest_rate: installmentData.interestRate,
        })
        .select()
        .single();

      if (installmentError) throw new Error("Taksit bilgisi kaydedilemedi");

      return { order, installment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["orders"]);
      toast.success("Taksitli sipariş başarıyla oluşturuldu!");
    },
    onError: (error) => {
      toast.error(error.message || "Sipariş oluşturulamadı");
    },
  });
}

/**
 * Hook for minimum installment amount rules
 */
export function useInstallmentRules() {
  return useQuery({
    queryKey: ["installment-rules"],
    queryFn: async () => {
      // These could come from database/admin settings
      return {
        minimumAmount: 100, // Minimum 100₺ for installments
        maximumInstallments: 12,
        minimumInstallmentAmount: 50, // Each installment must be at least 50₺
        allowedCardTypes: ["credit"], // Only credit cards allow installments
        blacklistedBins: [], // Blacklisted BIN numbers
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook for detecting card BIN (Bank Identification Number)
 */
export function useCardBinDetection(cardNumber) {
  return useQuery({
    queryKey: ["card-bin", cardNumber?.substring(0, 6)],
    queryFn: async () => {
      if (!cardNumber || cardNumber.length < 6) return null;

      const bin = cardNumber.substring(0, 6);

      // This would typically call a BIN detection API
      // For now, return mock data based on common Turkish bank BINs
      const binDatabase = {
        454360: { bank: "akbank", cardType: "credit", brand: "visa" },
        549881: { bank: "garanti", cardType: "credit", brand: "mastercard" },
        415565: { bank: "yapikredi", cardType: "credit", brand: "visa" },
        522020: { bank: "isbank", cardType: "credit", brand: "mastercard" },
        552879: { bank: "ziraat", cardType: "credit", brand: "mastercard" },
        404308: { bank: "halkbank", cardType: "credit", brand: "visa" },
      };

      const result = binDatabase[bin];
      if (result) {
        const bankInfo = BANK_INSTALLMENT_OPTIONS[result.bank];
        return {
          ...result,
          bankName: bankInfo?.name || "Bilinmeyen Banka",
          bankCode: result.bank,
          installmentOptions: bankInfo?.installments || [],
        };
      }

      return {
        bank: "unknown",
        cardType: "unknown",
        brand: "unknown",
        bankName: "Banka Tespit Edilemedi",
        installmentOptions: [],
      };
    },
    enabled: !!cardNumber && cardNumber.length >= 6,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * Utility function to format installment display text
 */
export function formatInstallmentText(installmentOption, amount) {
  if (installmentOption.count === 1) {
    return "Peşin";
  }

  const monthlyAmount = amount / installmentOption.count;

  if (installmentOption.interestRate === 0) {
    return `${installmentOption.count} Taksit - ${formatPrice(
      monthlyAmount
    )} x${installmentOption.count} (%0 Faiz)`;
  }

  const totalWithInterest = calculateInstallmentTotal(
    amount,
    installmentOption.count,
    installmentOption.interestRate
  );
  const monthlyWithInterest = totalWithInterest / installmentOption.count;

  return `${installmentOption.count} Taksit - ${formatPrice(
    monthlyWithInterest
  )} x${installmentOption.count}`;
}

/**
 * Utility function to calculate total installment amount
 */
export function calculateInstallmentTotal(
  amount,
  installmentCount,
  interestRate
) {
  if (interestRate === 0) {
    return amount;
  }

  const monthlyInterestRate = interestRate / 100 / 12;
  const compoundInterest = Math.pow(1 + monthlyInterestRate, installmentCount);
  const monthlyPayment =
    (amount * monthlyInterestRate * compoundInterest) / (compoundInterest - 1);

  return monthlyPayment * installmentCount;
}

/**
 * Utility function to validate installment eligibility
 */
export function validateInstallmentEligibility(
  amount,
  cardInfo,
  installmentRules
) {
  const errors = [];

  // Check minimum amount
  if (amount < installmentRules.minimumAmount) {
    errors.push(
      `Taksit için minimum tutar ${installmentRules.minimumAmount}₺ olmalıdır`
    );
  }

  // Check card type
  if (cardInfo.cardType !== "credit") {
    errors.push("Taksit seçeneği sadece kredi kartları için geçerlidir");
  }

  // Check minimum installment amount
  const bankOptions = BANK_INSTALLMENT_OPTIONS[cardInfo.bank];
  if (bankOptions) {
    bankOptions.installments.forEach((option) => {
      const monthlyAmount = amount / option.count;
      if (monthlyAmount < installmentRules.minimumInstallmentAmount) {
        errors.push(
          `${option.count} taksit için her taksit en az ${installmentRules.minimumInstallmentAmount}₺ olmalıdır`
        );
      }
    });
  }

  return {
    isEligible: errors.length === 0,
    errors,
  };
}

/**
 * Price formatting utility
 */
function formatPrice(price) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Hook for installment payment processing
 */
export function useProcessInstallmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentData, installmentInfo }) => {
      // This would integrate with payment processor (iyzico, PayTR, etc.)
      const response = await fetch("/api/payments/installment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...paymentData,
          installment: installmentInfo,
        }),
      });

      if (!response.ok) {
        throw new Error("Ödeme işlemi başarısız");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["user-orders"]);
      toast.success("Taksitli ödeme başarıyla tamamlandı!");
    },
    onError: (error) => {
      toast.error(error.message || "Ödeme işlemi başarısız");
    },
  });
}
