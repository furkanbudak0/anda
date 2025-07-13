import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "../contexts/AuthContext";

/**
 * A/B TESTING FRAMEWORK SİSTEMİ
 *
 * Özellikler:
 * - Çoklu varyant testleri
 * - Otomatik trafik dağılımı
 * - Real-time analitik
 * - İstatistiksel anlamlılık hesaplama
 * - Segment-based testing
 * - Conversion tracking
 * - Otomatik test durdurma
 */

/**
 * Ana A/B Testing hook'u
 */
export function useABTesting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Aktif testleri getir
  const { data: activeTests = [], isLoading } = useQuery({
    queryKey: ["ab-tests-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ab_tests")
        .select(
          `
          *,
          variants:ab_test_variants(*),
          analytics:ab_test_analytics(*)
        `
        )
        .eq("is_active", true)
        .eq("status", "running");

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Test oluşturma
  const createTest = useMutation({
    mutationFn: async (testData) => {
      // Test oluştur
      const { data: test, error: testError } = await supabase
        .from("ab_tests")
        .insert({
          name: testData.name,
          description: testData.description,
          test_type: testData.testType, // ui, pricing, feature, content
          hypothesis: testData.hypothesis,
          success_metric: testData.successMetric,
          start_date: testData.startDate,
          end_date: testData.endDate,
          target_pages: testData.targetPages,
          traffic_allocation: testData.trafficAllocation || 100,
          min_sample_size: testData.minSampleSize || 1000,
          confidence_level: testData.confidenceLevel || 95,
          created_by: user?.id,
          is_active: false, // Will be activated manually
          status: "draft",
        })
        .select()
        .single();

      if (testError) throw testError;

      // Varyantları oluştur
      const variants = testData.variants.map((variant, index) => ({
        test_id: test.id,
        name: variant.name,
        description: variant.description,
        config: variant.config,
        traffic_weight: variant.trafficWeight || 50,
        is_control: index === 0, // İlk varyant kontrol grubu
      }));

      const { error: variantsError } = await supabase
        .from("ab_test_variants")
        .insert(variants);

      if (variantsError) throw variantsError;

      return test;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["ab-tests"]);
    },
  });

  // Test başlatma
  const startTest = useMutation({
    mutationFn: async (testId) => {
      const { data, error } = await supabase
        .from("ab_tests")
        .update({
          is_active: true,
          status: "running",
          actual_start_date: new Date().toISOString(),
        })
        .eq("id", testId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["ab-tests"]);
    },
  });

  // Test durdurma
  const stopTest = useMutation({
    mutationFn: async ({ testId, reason }) => {
      const { data, error } = await supabase
        .from("ab_tests")
        .update({
          is_active: false,
          status: "stopped",
          end_reason: reason,
          actual_end_date: new Date().toISOString(),
        })
        .eq("id", testId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["ab-tests"]);
    },
  });

  return {
    activeTests,
    isLoading,
    createTest: createTest.mutate,
    startTest: startTest.mutate,
    stopTest: stopTest.mutate,
  };
}

/**
 * Kullanıcı için varyant atama hook'u
 */
export function useVariantAssignment(testId) {
  const [assignedVariant, setAssignedVariant] = useState(null);
  const { user } = useAuth();

  // Kullanıcı kimliği (giriş yapmamışsa session ID)
  const userId = user?.id || getSessionId();

  const { data: assignment } = useQuery({
    queryKey: ["variant-assignment", testId, userId],
    queryFn: async () => {
      if (!testId) return null;

      // Mevcut atamayı kontrol et
      const { data: existingAssignment } = await supabase
        .from("ab_test_assignments")
        .select(
          `
          *,
          variant:ab_test_variants(*)
        `
        )
        .eq("test_id", testId)
        .eq("user_identifier", userId)
        .single();

      if (existingAssignment) {
        return existingAssignment;
      }

      // Yeni atama yap
      const { data: test } = await supabase
        .from("ab_tests")
        .select(
          `
          *,
          variants:ab_test_variants(*)
        `
        )
        .eq("id", testId)
        .eq("is_active", true)
        .single();

      if (!test || !test.variants?.length) return null;

      // Trafik ağırlığına göre varyant seç
      const selectedVariant = selectVariantByWeight(test.variants, userId);

      // Atamayı kaydet
      const { data: newAssignment, error } = await supabase
        .from("ab_test_assignments")
        .insert({
          test_id: testId,
          variant_id: selectedVariant.id,
          user_identifier: userId,
          user_id: user?.id,
          assigned_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: "unknown", // Would be set server-side
        })
        .select(
          `
          *,
          variant:ab_test_variants(*)
        `
        )
        .single();

      if (error) throw error;
      return newAssignment;
    },
    enabled: !!testId,
    staleTime: Infinity, // Atama değişmez
  });

  useEffect(() => {
    if (assignment?.variant) {
      setAssignedVariant(assignment.variant);
    }
  }, [assignment]);

  return assignedVariant;
}

/**
 * A/B Test conversion tracking hook'u
 */
export function useConversionTracking() {
  const { user } = useAuth();
  const userId = user?.id || getSessionId();

  const trackConversion = useCallback(
    async (testId, conversionType, value = 0) => {
      try {
        // Kullanıcının bu testteki atamasını bul
        const { data: assignment } = await supabase
          .from("ab_test_assignments")
          .select("id, variant_id")
          .eq("test_id", testId)
          .eq("user_identifier", userId)
          .single();

        if (!assignment) {
          console.warn(`No A/B test assignment found for test ${testId}`);
          return;
        }

        // Conversion'ı kaydet
        const { error } = await supabase.from("ab_test_conversions").insert({
          test_id: testId,
          variant_id: assignment.variant_id,
          assignment_id: assignment.id,
          conversion_type: conversionType,
          conversion_value: value,
          user_identifier: userId,
          user_id: user?.id,
          converted_at: new Date().toISOString(),
          page_url: window.location.href,
        });

        if (error) throw error;

        console.log(`Conversion tracked for test ${testId}: ${conversionType}`);
      } catch (error) {
        console.error("Error tracking conversion:", error);
      }
    },
    [user, userId]
  );

  return { trackConversion };
}

/**
 * A/B Test analitikleri hook'u
 */
export function useABTestAnalytics(testId) {
  return useQuery({
    queryKey: ["ab-test-analytics", testId],
    queryFn: async () => {
      if (!testId) return null;

      // Test bilgilerini al
      const { data: test } = await supabase
        .from("ab_tests")
        .select(
          `
          *,
          variants:ab_test_variants(*)
        `
        )
        .eq("id", testId)
        .single();

      if (!test) return null;

      // Her varyant için analitik verileri
      const variantAnalytics = await Promise.all(
        test.variants.map(async (variant) => {
          // Katılımcı sayısı
          const { count: participantCount } = await supabase
            .from("ab_test_assignments")
            .select("id", { count: "exact" })
            .eq("variant_id", variant.id);

          // Conversion sayısı ve değeri
          const { data: conversions } = await supabase
            .from("ab_test_conversions")
            .select("conversion_type, conversion_value")
            .eq("variant_id", variant.id);

          const conversionCount = conversions?.length || 0;
          const conversionRate =
            participantCount > 0
              ? (conversionCount / participantCount) * 100
              : 0;
          const totalValue =
            conversions?.reduce(
              (sum, c) => sum + (c.conversion_value || 0),
              0
            ) || 0;
          const avgValue =
            conversionCount > 0 ? totalValue / conversionCount : 0;

          return {
            variant,
            participantCount,
            conversionCount,
            conversionRate,
            totalValue,
            avgValue,
          };
        })
      );

      // İstatistiksel anlamlılık hesaplama
      const significance = calculateSignificance(variantAnalytics);

      return {
        test,
        variantAnalytics,
        significance,
        winner: determineWinner(variantAnalytics),
      };
    },
    enabled: !!testId,
    refetchInterval: 30000, // 30 saniyede bir güncelle
  });
}

/**
 * Feature flag olarak A/B test kullanımı
 */
export function useFeatureFlag(flagName) {
  const variant = useVariantAssignment(`feature_${flagName}`);
  const { trackConversion } = useConversionTracking();

  const isEnabled = variant?.config?.enabled === true;

  const trackUsage = useCallback(() => {
    if (variant) {
      trackConversion(`feature_${flagName}`, "feature_used");
    }
  }, [variant, flagName, trackConversion]);

  return {
    isEnabled,
    variant: variant?.config,
    trackUsage,
  };
}

/**
 * UI Variant hook'u
 */
export function useUIVariant(testName, defaultComponent) {
  const variant = useVariantAssignment(`ui_${testName}`);

  if (!variant) {
    return defaultComponent;
  }

  return variant.config?.component || defaultComponent;
}

// Helper functions
function getSessionId() {
  let sessionId = localStorage.getItem("anda_session_id");
  if (!sessionId) {
    sessionId =
      "session_" + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("anda_session_id", sessionId);
  }
  return sessionId;
}

function selectVariantByWeight(variants, userId) {
  // Deterministic selection based on user ID
  const hash = hashString(userId);
  const totalWeight = variants.reduce((sum, v) => sum + v.traffic_weight, 0);

  let cumulative = 0;
  const target = ((hash % 100) / 100) * totalWeight;

  for (const variant of variants) {
    cumulative += variant.traffic_weight;
    if (target <= cumulative) {
      return variant;
    }
  }

  return variants[0]; // Fallback
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function calculateSignificance(variantAnalytics) {
  if (variantAnalytics.length < 2) return null;

  const control = variantAnalytics.find((v) => v.variant.is_control);
  const treatment = variantAnalytics.find((v) => !v.variant.is_control);

  if (!control || !treatment) return null;

  // Z-test for proportions
  const p1 = control.conversionRate / 100;
  const p2 = treatment.conversionRate / 100;
  const n1 = control.participantCount;
  const n2 = treatment.participantCount;

  if (n1 < 30 || n2 < 30) return null; // Sample size too small

  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  const z = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    zScore: z,
    pValue,
    isSignificant: pValue < 0.05,
    confidenceLevel: (1 - pValue) * 100,
    lift: ((p2 - p1) / p1) * 100,
  };
}

function normalCDF(x) {
  // Approximation of normal cumulative distribution function
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function determineWinner(variantAnalytics) {
  if (variantAnalytics.length < 2) return null;

  const sortedByConversion = [...variantAnalytics].sort(
    (a, b) => b.conversionRate - a.conversionRate
  );
  const winner = sortedByConversion[0];

  return {
    variant: winner.variant,
    improvement: winner.conversionRate - sortedByConversion[1].conversionRate,
  };
}
