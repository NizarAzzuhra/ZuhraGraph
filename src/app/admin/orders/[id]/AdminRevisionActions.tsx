"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  requestId: string;
  description: string;
}

export default function AdminRevisionActions({ orderId, requestId, description }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classification, setClassification] = useState<"ARTIST_ERROR" | "MINOR_REVISION" | "SCOPE_CHANGE">("MINOR_REVISION");
  const [extraFee, setExtraFee] = useState(0);
  const [reason, setReason] = useState("");

  const handleDecide = async (approve: boolean, e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/revision-request/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approve,
          classification,
          extraFee: Number(extraFee),
          reason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        router.refresh();
      } else {
        alert(data.message || "Gagal memproses revisi");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white border border-[#DDD7CE] rounded p-6 shadow-sm">
      <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Revision Request Review</h2>
      <div className="bg-[#F5F1EA] border border-[#DDD7CE] rounded p-5 mb-8">
        <h3 className="text-xs font-semibold text-[var(--color-secondary)] uppercase mb-3">Buyer's Description</h3>
        <p className="text-base text-[var(--color-primary)] italic border-l-2 border-[#DDD7CE] pl-4">
          {description}
        </p>
      </div>
      <form className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-primary)] uppercase">Classification</label>
            <select 
              name="classification"
              value={classification}
              onChange={(e: any) => setClassification(e.target.value)}
              className="w-full bg-transparent border border-[#DDD7CE] p-3 text-base text-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-0 transition-colors rounded appearance-none"
            >
              <option value="ARTIST_ERROR">Koreksi Artis</option>
              <option value="MINOR_REVISION">Revisi Minor</option>
              <option value="SCOPE_CHANGE">Scope Change</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--color-primary)] uppercase">Extra Fee (If Applicable)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-base text-[var(--color-secondary)]">Rp</span>
              <input 
                name="extraFee" 
                className="w-full bg-transparent border border-[#DDD7CE] p-3 pl-12 text-base text-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-0 transition-colors rounded" 
                type="number" 
                min={0}
                value={extraFee} 
                onChange={(e) => setExtraFee(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--color-primary)] uppercase">Internal Notes</label>
          <textarea 
            className="w-full bg-transparent border border-[#DDD7CE] p-3 text-base text-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-0 transition-colors rounded" 
            placeholder="Add notes for the execution team..." 
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-[#DDD7CE]">
          <button 
            className="px-6 py-2 border border-[#DDD7CE] text-[var(--color-primary)] text-sm font-semibold uppercase rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            type="button"
            onClick={(e) => handleDecide(false, e)}
            disabled={loading}
          >
            Reject Request
          </button>
          <button 
            className="px-6 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold uppercase rounded hover:bg-[#333] transition-colors disabled:opacity-50"
            type="button"
            onClick={(e) => handleDecide(true, e)}
            disabled={loading}
          >
            Approve & Execute
          </button>
        </div>
      </form>
    </section>
  );
}
