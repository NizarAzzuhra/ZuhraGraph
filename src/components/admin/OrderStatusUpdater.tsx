"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface Props {
  orderId: string;
  currentStatus: string;
}

const STATUS_OPTIONS = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "ARTWORK_UPLOADED",
  "WAITING_BUYER_CONFIRMATION",
  "REVISION_REQUESTED",
  "PROCESSING_REVISION",
  "COMPLETED",
  "CANCELLED",
];

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [confirmedStatus, setConfirmedStatus] = useState(currentStatus);
  const [pendingStatus, setPendingStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
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
        alert(`Error: ${errorData.error || res.statusText}`);
        // Revert UI if error
        setStatus(confirmedStatus);
        return;
      }

      setConfirmedStatus(pendingStatus);
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("An unexpected error occurred.");
      setStatus(confirmedStatus);
    } finally {
      setIsLoading(false);
    }
  };

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
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt.replace(/_/g, " ")}
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
