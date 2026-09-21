"use client";

import { useEffect } from "react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Ketentuan Layanan & Kebijakan</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
            <section>
              <h3 className="font-bold text-gray-900 mb-2">1. Alur Pengerjaan & Pembayaran</h3>
              <p>Pembayaran diproses secara aman melalui Midtrans. Pengerjaan akan dimulai setelah pembayaran terkonfirmasi. Waktu pengerjaan standar adalah 3-5 hari kerja (tergantung antrean dan kompleksitas pesanan).</p>
            </section>
            
            <section>
              <h3 className="font-bold text-gray-900 mb-2">2. Ketentuan Revisi</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Artist Error (Free):</strong> Kesalahan dari pihak kami yang tidak sesuai dengan brief awal yang telah disepakati. Bebas biaya.</li>
                <li><strong>Minor Revision (Kuota Paket):</strong> Perubahan kecil seperti warna, penyesuaian posisi, atau efek ringan. Sesuai dengan batas kuota revisi pada paket.</li>
                <li><strong>Scope Change (Extra Fee):</strong> Perubahan besar yang keluar dari brief awal (contoh: ubah pose karakter, ganti referensi utama secara drastis). Akan dikenakan biaya tambahan.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-2">3. Hak Cipta & Lisensi</h3>
              <p>Hak cipta penuh dari karya tetap menjadi milik artist, kecuali jika dibeli beserta lisensi komersial (V-Tuber, merchandise jualan, dll). Penggunaan personal seperti foto profil atau wallpaper diperbolehkan secara bebas tanpa biaya tambahan.</p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-2">4. Kebijakan Pembatalan & Refund</h3>
              <p>Refund hanya dapat dilakukan jika pesanan belum masuk tahap pengerjaan (sketsa). Jika proses sudah berjalan, refund tidak dapat dilakukan kecuali atas pembatalan sepihak dari pihak artist akibat force majeure.</p>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-[#9d4b36] hover:bg-[#853e2c] text-white font-medium rounded-xl transition-colors shadow-sm active:scale-95"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
