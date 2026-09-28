"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface AdminRefundButtonProps {
  orderId: string;
  currentStatus: string;
  totalAmount?: number;
}

const REFUNDABLE_STATUSES = [
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "ARTWORK_UPLOADED",
  "WAITING_BUYER_CONFIRMATION",
  "REVISION_REQUESTED",
  "PROCESSING_REVISION",
];

export default function AdminRefundButton({
  orderId,
  currentStatus,
  totalAmount,
}: AdminRefundButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");

  // Hanya render jika pesanan memenuhi syarat (sudah dibayar/sedang berjalan)
  if (!REFUNDABLE_STATUSES.includes(currentStatus)) {
    return null;
  }

  const handleRefund = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim() || "Pembatalan & refund langsung oleh Admin via dashboard",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.message || data.error || res.statusText || "Gagal memproses refund";
        alert(`Gagal Refund: ${errorMsg}`);
        return;
      }

      alert(data.message || "Refund otomatis berhasil diproses ke Midtrans dan pesanan telah dibatalkan.");
      setIsModalOpen(false);
      setReason("");
      router.refresh();
    } catch (error: any) {
      console.error("Failed to execute refund:", error);
      alert(`Terjadi kesalahan sistem: ${error.message || "Gagal menghubungi server"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider shadow-sm"
        title="Batalkan pesanan dan lakukan pengembalian dana via Midtrans API"
      >
        <span className="material-symbols-outlined text-[16px]">replay</span>
        <span>Batalkan & Refund</span>
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Konfirmasi Batalkan & Refund"
        message={`Tindakan ini akan memicu pengembalian dana (refund) otomatis langsung ke Midtrans${
          totalAmount ? ` sebesar Rp ${totalAmount.toLocaleString("id-ID")}` : ""
        }.\n\nJika metode pembayaran mendukung API refund, dana akan dikembalikan ke klien dan status pesanan otomatis diubah menjadi DIBATALKAN (CANCELLED).\n\nApakah Anda yakin ingin melanjutkan?`}
        confirmText="Ya, Batalkan & Refund"
        cancelText="Batal"
        variant="danger"
        isLoading={isLoading}
        onConfirm={handleRefund}
        onClose={() => {
          if (!isLoading) {
            setIsModalOpen(false);
          }
        }}
      />
    </>
  );
}
