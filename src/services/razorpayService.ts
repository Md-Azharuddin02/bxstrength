import { apiFetch, getApiUrl } from "./core/http";
import { getActiveMarketCountry } from "../utils/marketService";
import { canUseMockPayments } from "./mockPayment";

export interface RazorpayOrderResponse {
  success: boolean;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  receipt?: string;
  error?: string;
}

export interface RazorpayVerificationResponse {
  success: boolean;
  message: string;
  order_id?: string;
  payment_id?: string;
  error?: string;
}

export interface RazorpayCheckoutOptions {
  amount: number; // e.g. 50 for £50 (will be converted to smallest unit >= 100)
  currency?: string;
  country?: "GB" | "IN";
  name?: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  notes?: Record<string, any>;
  simulateSuccess?: boolean;
  onSuccess: (result: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

/**
 * Dynamically loads the Razorpay Standard Checkout Script
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * STEP 1: Calls backend API /api/payments/create-intent with automatic Primary -> Secondary Gateway Failover
 */
export const createRazorpayOrder = async (
  amount: number,
  currency?: string,
  receipt?: string,
  notes?: any,
  country?: "GB" | "IN",
  phone?: string,
): Promise<any> => {
  const activeCountry = country || getActiveMarketCountry();
  const idempotencyKey = `idemp_${notes?.userEmail || "client"}_${Date.now()}`;
  const response = await apiFetch(getApiUrl("/api/payments/create-intent"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount,
      currency,
      country: activeCountry,
      phone: phone || notes?.userPhone,
      receipt,
      planName: notes?.planName || notes?.planTitle,
      serviceType: notes?.serviceType || notes?.planType || "individual",
      customExercises: notes?.customExercises
        ? String(notes.customExercises).split(", ")
        : [],
      userEmail: notes?.userEmail,
      userName: notes?.userName,
      idempotencyKey,
    }),
  });

  const data = await response.json();
  if (!response.ok || (!data.order_id && !data.checkoutUrl)) {
    throw new Error(
      data.error ||
        data.details ||
        "Failed to initialize payment gateway intent",
    );
  }

  return data;
};

/**
 * STEP 3: Calls backend API /api/verify-payment to verify HMAC-SHA256 signature
 */
export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  [key: string]: any;
}): Promise<RazorpayVerificationResponse> => {
  const response = await apiFetch(getApiUrl("/api/payments/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(
      data.error || data.message || "Payment signature verification failed",
    );
  }

  return data;
};

/**
 * STEP 2: Main Frontend Failover-Aware Checkout Handler
 */
export const openRazorpayCheckout = async (
  options: RazorpayCheckoutOptions,
): Promise<void> => {
  try {
    if (
      options.simulateSuccess &&
      canUseMockPayments(import.meta.env.DEV, import.meta.env.VITE_ENABLE_MOCK_PAYMENTS)
    ) {
      options.onSuccess({
        razorpay_order_id: `test_order_${Date.now()}`,
        razorpay_payment_id: `test_payment_${Date.now()}`,
        razorpay_signature: "MOCK_PAYMENT_SIMULATION",
      });
      return;
    }

    const activeCountry = options.country || getActiveMarketCountry();
    // 1. Create order intent on server (handles Razorpay -> Stripe automatic failover)
    const orderData = await createRazorpayOrder(
      options.amount,
      options.currency,
      `rcpt_${Date.now()}`,
      {
        ...options.notes,
        userEmail: options.userEmail,
        userName: options.userName,
        userPhone: options.userPhone,
      },
      activeCountry,
      options.userPhone,
    );

    // If primary gateway (Razorpay) failed over to secondary gateway (Cashfree PG)
    if (
      (orderData.gateway === "cashfree" || orderData.gateway === "stripe") &&
      orderData.checkoutUrl
    ) {
      window.location.href = orderData.checkoutUrl;
      return;
    }

    // 2. Ensure Razorpay checkout script is loaded for primary gateway
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error(
        "Payment gateway SDK failed to load. Please check your network connection.",
      );
    }

    const metaEnv = (import.meta as any).env || {};
    const keyId =
      metaEnv.VITE_RAZORPAY_KEY_ID ||
      metaEnv.RAZORPAY_KEY_ID ||
      orderData.key_id;

    // 3. Configure Razorpay Standard Modal Options
    const razorpayOptions = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: options.name || "BxStrength Performance",
      description:
        options.description || "1-on-1 Fitness & Performance Protocol",
      order_id: orderData.order_id,
      image: "/favicon.svg",
      prefill: {
        name: options.userName || "",
        email: options.userEmail || "",
        contact: options.userPhone || "",
      },
      notes: options.notes || {},
      theme: {
        color: "#CCFF00",
        backdrop_color: "rgba(10, 10, 12, 0.9)",
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          // Verify payment signature on backend
          await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          // Execute success callback
          options.onSuccess(response);
        } catch (verifyErr: any) {
          if (options.onFailure) {
            options.onFailure(verifyErr);
          } else {
            alert(`Payment Verification Error: ${verifyErr.message}`);
          }
        }
      },
      modal: {
        ondismiss: function () {
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
    };

    // 4. Instantiate and open Razorpay Payment Modal
    const rzp = new (window as any).Razorpay(razorpayOptions);

    rzp.on("payment.failed", function (response: any) {
      const errorMsg =
        response.error?.description ||
        response.error?.reason ||
        "Payment failed";
      if (options.onFailure) {
        options.onFailure(new Error(errorMsg));
      } else {
        alert(`Razorpay Payment Failed: ${errorMsg}`);
      }
    });

    rzp.open();
  } catch (err: any) {
    if (options.onFailure) {
      options.onFailure(err);
    } else {
      alert(`Razorpay Checkout Error: ${err.message}`);
    }
  }
};
