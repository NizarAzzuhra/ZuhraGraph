"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReferenceUploader, ReferenceImage } from "./ReferenceUploader";
import TermsModal from "../../../components/TermsModal";

export default function CheckoutForm({ packageData }: { packageData: any }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brief, setBrief] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [characterRefs, setCharacterRefs] = useState<ReferenceImage[]>([]);
  const [designRefs, setDesignRefs] = useState<ReferenceImage[]>([]);
  const [additionalRefs, setAdditionalRefs] = useState<ReferenceImage[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");

  const isUploading = uploadingCount > 0;

  const handleUploadStart = () => setUploadingCount(prev => prev + 1);
  const handleUploadEnd = () => setUploadingCount(prev => Math.max(0, prev - 1));

  const thumbnailSrc = packageData?.imageUrl || packageData?.image || packageData?.image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuC87nJt4UTWPv2ebTjdiihduGbbF1KtcDhTsTj5QDmjYWAc7U6Wr6NuFRnNc4ImRHFoqVZHfLQW9bKUDT2F-hP64tea6OcGO9tf5ioFIm_guNlMNp4qJS04fmI2Cti53NKq1Tu2XGu30corc3S8dcYpKNP7RGtRAi3Qy5-AwPsNUfOBJGosXsn2FKyP1j6kXCT7akni73-1yUj656v-xfYbl9_WR7Q2Zr-AAd7snMICqpWVI-ntsX5H_Q";

  console.log("Package Data di CheckoutForm:", packageData);

  const checkAuthForUpload = () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/packages/${packageData.id}`);
      return false;
    }
    return true;
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/packages/${packageData.id}`);
      return;
    }

    if (!phone.trim()) {
      setError("Nomor WhatsApp/telepon wajib diisi untuk koordinasi pesanan.");
      return;
    }

    if (!brief.trim()) {
      setError("Deskripsi proyek wajib diisi.");
      return;
    }

    if (brief.length > 1000) {
      setError("Deskripsi proyek tidak boleh lebih dari 1000 karakter.");
      return;
    }

    if (!termsAccepted) {
      setError("Anda harus menyetujui Ketentuan Layanan Commission untuk melanjutkan.");
      return;
    }

    if (isUploading) {
      setError("Harap tunggu semua file selesai diunggah sebelum mengirimkan pesanan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const commissionBrief = {
        description: brief,
        notes: notes,
        characterReferences: characterRefs.map(r => r.url),
        designReferences: designRefs.map(r => r.url),
        additionalReferences: additionalRefs.map(r => r.url)
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageData.id,
          brief: JSON.stringify(commissionBrief),
          termsAccepted: termsAccepted,
          buyerInfo: {
            first_name: session?.user?.name || "Buyer",
            email: session?.user?.email || "buyer@example.com",
            phone: phone.trim()
          }
        })
      });

      const data = await res.json();

      if (data.success) {
        if (data.data?.paymentInfo?.token) {
          if (typeof window.snap !== 'undefined') {
            const orderId = data.data.order.id;
            const syncStatus = async () => {
              try {
                await fetch(`/api/orders/${orderId}/sync`, { method: 'POST' });
              } catch (syncErr) {
                console.error("Failed to sync payment status:", syncErr);
              }
            };

            window.snap.pay(data.data.paymentInfo.token, {
              onSuccess: async function () {
                await syncStatus();
                router.push(`/orders/${orderId}`);
                router.refresh();
              },
              onPending: async function () {
                await syncStatus();
                router.push(`/orders/${orderId}`);
                router.refresh();
              },
              onError: async function () {
                await syncStatus();
                setError("Pembayaran gagal! Silakan coba lagi dari halaman detail pesanan.");
                setTimeout(() => {
                  router.push(`/orders/${orderId}`);
                  router.refresh();
                }, 2000);
              },
              onClose: async function () {
                await syncStatus();
                router.push(`/orders/${orderId}`);
                router.refresh();
              }
            });
          } else {
            window.location.href = `/orders/${data.data.order.id}`;
          }
        } else {
          // Partial success: Order created but payment initiation failed.
          // Redirect to order detail to allow retry.
          router.push(`/orders/${data.data.order.id}`);
        }
      } else {
        setError(data.message || "Gagal membuat pesanan.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
      {/* Left Column: Forms */}
      <div className="lg:col-span-8 flex flex-col gap-12">
        {/* Package Summary Card (Mobile mostly, visible on desktop as context) */}
        <div className="border border-[#E8E0D5] rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFFFFF]">
          <div>
            <h3 className="text-headline-md font-headline-md text-on-surface mb-1">{packageData.name}</h3>
            <div className="flex gap-4 text-caption font-caption text-[#7A7067]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0" }}>schedule</span>
                3–5 hari
              </span>
              <span className="flex items-center gap-1 text-tertiary-container">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Tersedia
              </span>
            </div>
          </div>
          <div className="text-headline-md font-headline-md text-primary">Rp {packageData.price.toLocaleString('id-ID')}</div>
        </div>

        {/* Contact Information (Phone / WhatsApp) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">Informasi Kontak</h2>
          <div>
            <label htmlFor="phone" className="block text-label-md font-label-md uppercase text-[#7A7067] mb-2">
              Nomor WhatsApp / Telepon <span className="text-[#9d4b36] font-bold">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              required
              disabled={loading}
              className="w-full bg-transparent border border-outline-variant focus:border-on-surface focus:ring-0 p-4 text-body-md font-body-md rounded-xl transition-colors disabled:opacity-50"
            />
            <p className="text-caption font-caption text-[#7A7067] mt-1">
              Nomor ini digunakan untuk konfirmasi status pengerjaan, notifikasi pesanan, dan koordinasi dengan desainer/artis.
            </p>
          </div>
        </section>

        {/* Brief Textarea */}
        <section className="flex flex-col gap-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">Brief Commission</h2>
          <div className="relative">
            <label htmlFor="brief" className="block text-label-md font-label-md uppercase text-[#7A7067] mb-2">Deskripsi Proyek</label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className={`w-full bg-transparent border ${brief.length > 1000 ? 'border-error focus:border-error focus:ring-0' : 'border-outline-variant focus:border-on-surface focus:ring-0'} p-4 text-body-md font-body-md rounded-xl transition-colors disabled:opacity-50 resize-y`}
              placeholder="Jelaskan suasana, komposisi, karakter, warna, teks, efek, dan elemen spesifik yang Anda inginkan..."
              rows={6}
              disabled={loading}
            ></textarea>
            {brief.length > 1000 && (
              <p className="text-caption font-caption text-error mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span> Deskripsi proyek tidak boleh melebihi 1000 karakter.
              </p>
            )}
            <div className="flex justify-between mt-2 text-caption font-caption text-[#7A7067]">
              <span>Sertakan detail sebanyak mungkin.</span>
              <span className={brief.length > 1000 ? "text-error font-bold" : ""}>{brief.length}/1000</span>
            </div>
            <div className="mt-4 bg-[#FFFFFF] p-4 rounded-xl border border-[#E8E0D5]">
              <p className="text-label-md font-label-md text-on-surface mb-2 font-medium">Butuh bantuan menulis brief?</p>
              <ul className="text-body-md font-body-md text-[#7A7067] list-disc list-inside space-y-1">
                <li>Karakter dan pose</li>
                <li>Warna yang diinginkan</li>
                <li>Teks/konten</li>
                <li>Gaya visual</li>
                <li>Efek</li>
                <li>Permintaan khusus</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Character / Design Asset References */}
        <section className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Karakter / Aset Desain</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
            </div>
            <p className="text-caption font-caption text-[#7A7067]">Unggah gambar karakter atau aset visual yang ingin digunakan jika ada. (Maks 3)</p>
          </div>

          <ReferenceUploader
            title="Referensi Karakter / Aset"
            description="Unggah gambar karakter utama atau aset visual sebagai panduan desain. (Opsional)"
            maxFiles={3}
            images={characterRefs}
            setImages={setCharacterRefs}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
            onError={setError}
            disabled={loading}
            onBeforeUpload={checkAuthForUpload}
          />
        </section>

        {/* Design References */}
        <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Desain</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
            </div>
            <p className="text-caption font-caption text-[#7A7067]">Unggah contoh pencahayaan, warna, atau gaya komposisi yang Anda sukai. (Maks 3)</p>
          </div>

          <ReferenceUploader
            title="Referensi Desain"
            description="Contoh gaya desain, komposisi, atau referensi dari artis lain sebagai panduan visual. (Opsional)"
            maxFiles={3}
            images={designRefs}
            setImages={setDesignRefs}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
            onError={setError}
            disabled={loading}
            onBeforeUpload={checkAuthForUpload}
          />
        </section>

        {/* Additional References */}
        <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Tambahan</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
            </div>
            <p className="text-caption font-caption text-[#7A7067]">Unggah referensi visual lain yang dapat membantu. (Maks 5)</p>
          </div>

          <ReferenceUploader
            title="Referensi Tambahan"
            description="Objek, tekstur, atau detail lain seperti senjata, logo, dll. (Opsional)"
            maxFiles={5}
            images={additionalRefs}
            setImages={setAdditionalRefs}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
            onError={setError}
            disabled={loading}
            onBeforeUpload={checkAuthForUpload}
          />
        </section>

        {/* Additional Notes */}
        <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
          <div className="flex items-center gap-2">
            <h2 className="text-headline-md font-headline-md text-on-surface">Catatan Tambahan</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
          </div>
          <div className="relative">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent border border-outline-variant focus:border-on-surface focus:ring-0 p-4 text-body-md font-body-md rounded-xl transition-colors disabled:opacity-50 resize-y"
              placeholder="Ada detail lain yang ingin Anda sampaikan?"
              rows={3}
              disabled={loading}
            ></textarea>
          </div>
        </section>
      </div>

      {/* Right Column: Sidebar / Order Summary */}
      <div className="lg:col-span-4">
        <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-3xl p-6 shadow-sm sticky top-28">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Ringkasan Pesanan</h3>

          {/* Thumbnail & Layanan */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
              <img
                src={thumbnailSrc}
                alt={packageData?.name || "Thumbnail"}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">LAYANAN</div>
              <div className="text-base font-bold text-gray-900">{packageData?.name || "GFX C4D Design"}</div>
            </div>
          </div>

          {/* Garis Pembatas */}
          <div className="border-t border-[#f0eae5] my-4" />

          {/* Detail Biaya */}
          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex justify-between">
              <span>Waktu Pengerjaan</span>
              <span className="font-semibold text-gray-900">3–5 hari</span>
            </div>
            <div className="flex justify-between">
              <span>Harga Dasar</span>
              <span className="font-semibold text-gray-900">
                Rp {packageData?.price ? packageData.price.toLocaleString("id-ID") : "250.000"}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline mb-6 pt-2">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-2xl font-extrabold text-[#9d4b36]">
              Rp {packageData?.price ? packageData.price.toLocaleString("id-ID") : "250.000"}
            </span>
          </div>

          {/* Pesan Error jika ada */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Tombol CTA Terracotta */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || isUploading || status === "loading"}
            className="w-full py-4 bg-[#9d4b36] hover:bg-[#853e2c] active:scale-[0.99] text-white font-bold text-sm tracking-wider uppercase rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : isUploading ? "Mengunggah File..." : status === "unauthenticated" ? "Masuk untuk Pesan" : "BUAT PESANAN"}
          </button>

          {/* Terms Agreement */}
          <div className="mt-4 flex items-start justify-center gap-2 text-center text-xs text-gray-500 leading-relaxed">
            <input
              type="checkbox"
              id="terms-sidebar"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#9d4b36] border-gray-300 focus:ring-[#9d4b36] cursor-pointer flex-shrink-0"
            />
            <div className="text-[11px] text-gray-500 text-left">
              <label htmlFor="terms-sidebar" className="cursor-pointer">
                Dengan membuat pesanan, Anda menyetujui
              </label>{" "}
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTermsOpen(true);
                }} 
                className="underline cursor-pointer font-medium text-gray-700 hover:text-[#9d4b36]"
              >
                Ketentuan Layanan dan Kebijakan Commission
              </button>.
            </div>
          </div>

        </div>
      </div>

      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}
