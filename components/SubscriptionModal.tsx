"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type Plan = {
  months: number;
  amount: number;
  label: string;
};

const plans: Plan[] = [
  {
    months: 1,
    amount: 100,
    label: "1 Month",
  },
  {
    months: 2,
    amount: 175,
    label: "2 Months",
  },
  {
    months: 3,
    amount: 250,
    label: "3 Months",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionModal({
  open,
  onClose,
}: Props) {
  const [loadingPlan, setLoadingPlan] =
    useState<number | null>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  // Get currently logged-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUserId(user?.uid || null);
      }
    );

    return () => unsubscribe();
  }, []);

  if (!open) {
    return null;
  }

  async function startPayment(plan: Plan) {
    try {
      // Login check
      if (!userId) {
        alert(
          "Please login before purchasing a subscription."
        );
        return;
      }

      setLoadingPlan(plan.months);

      // Load Razorpay Checkout
      if (!window.Razorpay) {
        await new Promise<void>(
          (resolve, reject) => {
            const script =
              document.createElement("script");

            script.src =
              "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Razorpay checkout could not load."
                )
              );

            document.body.appendChild(script);
          }
        );
      }

      // Create Razorpay order
      const orderResponse = await fetch(
        "/api/payment/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: plan.amount * 100,
          }),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.error ||
            "Unable to create payment order."
        );
      }

      // Get public Razorpay Key ID
      const keyResponse = await fetch(
        "/api/razorpay-key"
      );

      const keyData =
        await keyResponse.json();

      if (
        !keyResponse.ok ||
        !keyData.keyId
      ) {
        throw new Error(
          "Razorpay Key ID could not be loaded."
        );
      }

      const options = {
        key: keyData.keyId,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "StenoCheck",

        description:
          `${plan.label} Typing Practice Subscription`,

        order_id: orderData.order_id,

        handler: async function (
          response: any
        ) {
          try {
            // Verify payment and activate subscription
            const verifyResponse =
              await fetch(
                "/api/payment/verify-payment",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    userId: userId,

                    months: plan.months,

                    amount: plan.amount,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            alert(
              `Payment successful!\n\n${plan.label} subscription activated successfully.`
            );

            onClose();

            // Refresh page so subscription state can update
            window.location.reload();
          } catch (error: any) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            alert(
              error?.message ||
                "Payment verification failed."
            );
          } finally {
            setLoadingPlan(null);
          }
        },

        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },

        theme: {
          color: "#2563eb",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        (response: any) => {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          alert(
            response?.error?.description ||
              "Payment failed."
          );

          setLoadingPlan(null);
        }
      );

      razorpay.open();
    } catch (error: any) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      alert(
        error?.message ||
          "Unable to start payment."
      );

      setLoadingPlan(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-10"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
        >
          ✕
        </button>

        {/* Header */}
        <div className="pr-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            🔒
          </div>

          <h2 className="mt-5 text-3xl font-extrabold text-slate-900">
            Unlock Full Practice
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Get access to paid Delhi High Court
            typing practice passages.
          </p>
        </div>

        {/* Plans */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.months}
              className={`relative rounded-2xl p-6 text-center ${
                plan.months === 2
                  ? "border-2 border-blue-500"
                  : "border border-slate-200"
              }`}
            >
              {plan.months === 2 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white">
                  POPULAR
                </div>
              )}

              <h3 className="font-bold text-slate-900">
                {plan.label}
              </h3>

              <div className="mt-3 text-4xl font-extrabold text-blue-700">
                ₹{plan.amount}
              </div>

              <p className="mt-2 text-sm text-slate-500">
                Full access for{" "}
                {plan.months} month
                {plan.months > 1
                  ? "s"
                  : ""}
              </p>

              <button
                type="button"
                disabled={
                  loadingPlan !== null
                }
                onClick={() =>
                  startPayment(plan)
                }
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingPlan ===
                plan.months
                  ? "Processing..."
                  : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="mt-8 rounded-2xl bg-slate-50 p-6">
          <h3 className="font-bold text-slate-900">
            Subscription includes
          </h3>

          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              ✓ Paid typing passages
            </div>

            <div>
              ✓ Easy, Moderate & Difficult
            </div>

            <div>
              ✓ 10-minute practice tests
            </div>

            <div>
              ✓ Detailed accuracy results
            </div>
          </div>
        </div>

        {/* Later */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Maybe Later
          </button>
          
        </div>
      </div>
    </div>
  );
}