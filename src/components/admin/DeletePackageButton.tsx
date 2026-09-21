"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function DeletePackageButton({ packageId }: { packageId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/packages/${packageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
        return;
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus paket.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={isLoading}
        className="p-2 text-[#7A7067] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-2 flex items-center justify-center"
        title="Hapus Paket"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Konfirmasi Penghapusan"
        message="Yakin ingin menghapus paket ini? Tindakan ini permanen. Semua berkas gambar dan riwayat transaksi terkait akan terpengaruh jika paket dihapus."
        confirmText="Ya, Hapus Data"
        variant="danger"
        isLoading={isLoading}
        onConfirm={confirmDelete}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
