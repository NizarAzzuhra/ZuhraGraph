"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CheckoutForm({ packageData }: { packageData: any }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/packages/${packageData.id}`);
      return;
    }

    if (!brief.trim()) {
      setError("Please provide a brief for your commission.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageData.id,
          brief: brief,
          buyerInfo: {
            first_name: session?.user?.name || "Buyer",
            email: session?.user?.email || "buyer@example.com",
            phone: "08123456789"
          }
        })
      });

      const data = await res.json();
      
      if (data.success && data.data?.paymentInfo?.token) {
        // Trigger Midtrans Snap Popup
        if (typeof window.snap !== 'undefined') {
          window.snap.pay(data.data.paymentInfo.token, {
            onSuccess: function(result: any) {
              router.push('/testSession?status=success');
            },
            onPending: function(result: any) {
              router.push('/testSession?status=pending');
            },
            onError: function(result: any) {
              setError("Payment failed! Please try again.");
            },
            onClose: function() {
              setError("You closed the payment popup without finishing.");
            }
          });
        } else {
          // Fallback redirect if snap is not loaded
          window.location.href = data.data.paymentInfo.redirectUrl;
        }
      } else {
        setError(data.message || "Failed to create order.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCheckout} className="mt-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="brief" className="font-semibold text-sm tracking-wide text-[#2D2D2D]">
          COMMISSION BRIEF <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[#2D2D2D]/60 mb-2">
          Describe what you want me to draw. Be as specific as possible (pose, colors, mood, references).
        </p>
        <textarea
          id="brief"
          rows={6}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="I would like a portrait of my original character..."
          className="w-full p-4 rounded-xl border border-[#2D2D2D]/20 bg-[#FDFBF7] focus:outline-none focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F] transition-all resize-y"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || status === "loading"}
        className="w-full py-4 rounded-full bg-[#2D2D2D] text-[#FDFBF7] font-semibold text-lg hover:bg-[#E07A5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? "Processing..." : status === "unauthenticated" ? "Login to Order" : `Order for Rp ${Number(packageData.price).toLocaleString('id-ID')}`}
      </button>
      
      <p className="text-xs text-center text-[#2D2D2D]/50 mt-2">
        By placing an order, you agree to our Terms of Service. Payments are processed securely via Midtrans.
      </p>
    </form>
  );
}
