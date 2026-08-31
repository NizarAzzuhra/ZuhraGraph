"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePackageButton({ packageId }: { packageId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm("Yakin ingin menghapus paket ini? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }

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

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus paket.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      className="p-2 text-[#7A7067] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 ml-2 flex items-center justify-center"
      title="Hapus Paket"
    >
      <span className="material-symbols-outlined text-[20px]">delete</span>
    </button>
  );
}
