"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface Props {
  orderId: string;
  currentStatus: string;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['AWAITING_PAYMENT', 'CANCELLED'],
  AWAITING_PAYMENT: ['CANCELLED'],
  PAID: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['ARTWORK_UPLOADED', 'CANCELLED'],
  ARTWORK_UPLOADED: ['WAITING_BUYER_CONFIRMATION', 'PROCESSING', 'CANCELLED'],
  WAITING_BUYER_CONFIRMATION: ['REVISION_REQUESTED', 'COMPLETED'],
  REVISION_REQUESTED: ['PROCESSING_REVISION', 'WAITING_BUYER_CONFIRMATION', 'CANCELLED'],
  PROCESSING_REVISION: ['ARTWORK_UPLOADED', 'WAITING_BUYER_CONFIRMATION', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [confirmedStatus, setConfirmedStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const availableNextStatuses = VALID_TRANSITIONS[confirmedStatus] || [];
  const isTerminal = availableNextStatuses.length === 0;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === confirmedStatus) return;
    setStatus(newStatus);
    setPendingStatus(newStatus);
    setIsModalOpen(true);
  };
  
  const handleCancel = () => {
    setStatus(confirmedStatus);
    setIsModalOpen(false);
  };

  const confirmStatusChange = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Gagal: ${errorData.message || errorData.error || res.statusText}`);
        setStatus(confirmedStatus);
        setIsModalOpen(false);
        return;
      }

      setConfirmedStatus(pendingStatus);
      setStatus(pendingStatus);
      setIsModalOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      alert("Terjadi kesalahan yang tidak terduga.");
      setStatus(confirmedStatus);
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isTerminal) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#EADCC9] bg-[#F5F1EA] text-xs font-semibold text-[#7A7067] uppercase tracking-wider">
        {confirmedStatus.replace(/_/g, " ")} (Final)
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isLoading}
        className={`rounded-lg border border-[#EADCC9] bg-white text-xs font-medium text-[#1F2937] px-3 py-1.5 outline-none transition-colors cursor-pointer appearance-none pr-8 ${
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#FAF6F0]"
        } focus:border-[#EADCC9] focus:ring-0 uppercase tracking-wider`}
      >
        <option value={confirmedStatus} disabled>
          {confirmedStatus.replace(/_/g, " ")} (Saat ini)
        </option>
        {availableNextStatuses.map((opt) => (
          <option key={opt} value={opt}>
            ➜ {opt.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#6B7280]">
        <span className="material-symbols-outlined text-sm">expand_more</span>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Konfirmasi Perubahan Status"
        message={`Apakah Anda yakin ingin mengubah status pesanan ini menjadi ${pendingStatus.replace(/_/g, " ")}?`}
        confirmText="Ya, Ubah Status"
        cancelText="Batal"
        variant="warning"
        isLoading={isLoading}
        onConfirm={confirmStatusChange}
        onClose={handleCancel}
      />
    </div>
  );
}
