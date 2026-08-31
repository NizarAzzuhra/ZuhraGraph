"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleCommissionButton({ packageId, initialStatus }: { packageId: string, initialStatus: boolean }) {
  const [isOpen, setIsOpen] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAcceptingOrders: !isOpen }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || res.statusText}`);
        return;
      }

      setIsOpen(!isOpen);
      router.refresh(); // Memperbarui data di halaman
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all ${
        isOpen ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
      } disabled:opacity-50`}
    >
      {isLoading ? "Memproses..." : isOpen ? "Tutup Komisi" : "Buka Komisi"}
    </button>
  );
}
