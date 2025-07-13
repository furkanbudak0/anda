/**
 * CENTRAL SERVICE LAYER EXPORTS
 *
 * Tüm service'ler için merkezi export sistemi.
 * Import'ları kolaylaştırır ve service discovery sağlar.
 */

// Authentication Services
export * from "./apiAuth";

// Product Services
export { apiProducts } from "./apiProducts";
export { default as getProductById } from "./getProductById";

// Seller Services
export * from "./apiSellers";

// Supabase Configuration
export { default as supabase, supabaseUrl } from "./supabase";

// Import for internal use
import supabaseClient from "./supabase";

// Service Categories for Easy Discovery
export const services = {
  auth: {
    userSignup: () => import("./apiAuth").then((m) => m.userSignup),
    sellerSignup: () => import("./apiAuth").then((m) => m.sellerSignup),
    login: () => import("./apiAuth").then((m) => m.login),
    logout: () => import("./apiAuth").then((m) => m.logout),
    getCurrentUser: () => import("./apiAuth").then((m) => m.getCurrentUser),
    updateCurrentUser: () =>
      import("./apiAuth").then((m) => m.updateCurrentUser),
  },

  products: {
    getProducts: () =>
      import("./apiProducts").then((m) => m.apiProducts.getProducts),
    getProduct: () =>
      import("./apiProducts").then((m) => m.apiProducts.getProduct),
    createProduct: () =>
      import("./apiProducts").then((m) => m.apiProducts.createProduct),
    updateProduct: () =>
      import("./apiProducts").then((m) => m.apiProducts.updateProduct),
    deleteProduct: () =>
      import("./apiProducts").then((m) => m.apiProducts.deleteProduct),
    getFeaturedProducts: () =>
      import("./apiProducts").then((m) => m.apiProducts.getFeaturedProducts),
    getBestSellers: () =>
      import("./apiProducts").then((m) => m.apiProducts.getBestSellers),
    getNewArrivals: () =>
      import("./apiProducts").then((m) => m.apiProducts.getNewArrivals),
  },

  sellers: {
    getSellerProfile: () =>
      import("./apiSellers").then((m) => m.getSellerProfile),
    updateSellerProfile: () =>
      import("./apiSellers").then((m) => m.updateSellerProfile),
    getProductsBySeller: () =>
      import("./apiSellers").then((m) => m.getProductsBySeller),
  },
};

// Service Health Check
export const serviceHealthCheck = async () => {
  try {
    const { error } = await supabaseClient
      .from("products")
      .select("id")
      .limit(1);
    return {
      status: error ? "error" : "healthy",
      error: error?.message,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: "error",
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Service layer metadata
export const serviceInfo = {
  version: "1.0.0",
  description: "ANDA E-Commerce Service Layer",
  services: Object.keys(services),
  lastUpdated: "2024-12-01",
};
