"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReferenceUploader, ReferenceImage } from "./ReferenceUploader";

export default function CheckoutForm({ packageData }: { packageData: any }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [brief, setBrief] = useState("");
  const [notes, setNotes] = useState("");
  const [characterRefs, setCharacterRefs] = useState<ReferenceImage[]>([]);
  const [designRefs, setDesignRefs] = useState<ReferenceImage[]>([]);
  const [additionalRefs, setAdditionalRefs] = useState<ReferenceImage[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState("");

  const isUploading = uploadingCount > 0;

  const handleUploadStart = () => setUploadingCount(prev => prev + 1);
  const handleUploadEnd = () => setUploadingCount(prev => Math.max(0, prev - 1));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/packages/${packageData.id}`);
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

    if (characterRefs.length === 0) {
      setError("Referensi Karakter wajib diunggah (minimal 1 gambar).");
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
            phone: "08123456789"
          }
        })
      });

      const data = await res.json();

      if (data.success) {
        if (data.data?.paymentInfo?.token) {
          if (typeof window.snap !== 'undefined') {
            window.snap.pay(data.data.paymentInfo.token, {
              onSuccess: function () {
                router.push(`/orders/${data.data.order.id}`);
              },
              onPending: function () {
                router.push(`/orders/${data.data.order.id}`);
              },
              onError: function () {
                setError("Pembayaran gagal! Silakan coba lagi dari halaman detail pesanan.");
                setTimeout(() => router.push(`/orders/${data.data.order.id}`), 2000);
              },
              onClose: function () {
                router.push(`/orders/${data.data.order.id}`);
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
        <div className="border border-outline-variant rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest">
          <div>
            <h3 className="text-headline-md font-headline-md text-on-surface mb-1">{packageData.name}</h3>
            <div className="flex gap-4 text-caption font-caption text-on-surface-variant">
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

        {/* Brief Textarea */}
        <section className="flex flex-col gap-4">
          <h2 className="text-headline-md font-headline-md text-on-surface">Brief Commission</h2>
          <div className="relative">
            <label htmlFor="brief" className="block text-label-md font-label-md uppercase text-on-surface-variant mb-2">Deskripsi Proyek</label>
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
            <div className="flex justify-between mt-2 text-caption font-caption text-on-surface-variant">
              <span>Sertakan detail sebanyak mungkin.</span>
              <span className={brief.length > 1000 ? "text-error font-bold" : ""}>{brief.length}/1000</span>
            </div>
            <div className="mt-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
              <p className="text-label-md font-label-md text-on-surface mb-2 font-medium">Butuh bantuan menulis brief?</p>
              <ul className="text-body-md font-body-md text-on-surface-variant list-disc list-inside space-y-1">
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

        {/* Character References */}
        <section className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Karakter</h2>
            </div>
            <p className="text-caption font-caption text-on-surface-variant">Unggah gambar karakter yang ingin digunakan. (Maks 3)</p>
          </div>

          <ReferenceUploader
            title="Referensi Karakter"
            description="Unggah gambar karakter utama yang akan digunakan dalam desain. (Wajib)"
            maxFiles={3}
            images={characterRefs}
            setImages={setCharacterRefs}
            onUploadStart={handleUploadStart}
            onUploadEnd={handleUploadEnd}
            onError={setError}
            disabled={loading}
          />
        </section>

        {/* Design References */}
        <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Desain</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
            </div>
            <p className="text-caption font-caption text-on-surface-variant">Unggah contoh pencahayaan, warna, atau gaya komposisi yang Anda sukai. (Maks 3)</p>
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
          />
        </section>

        {/* Additional References */}
        <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-headline-md font-headline-md text-on-surface">Referensi Tambahan</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase tracking-wider font-medium">Opsional</span>
            </div>
            <p className="text-caption font-caption text-on-surface-variant">Unggah referensi visual lain yang dapat membantu. (Maks 5)</p>
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
      <div className="lg:col-span-4 lg:self-start lg:sticky lg:top-28 relative mt-12 lg:mt-0">
        <div className="border border-outline-variant rounded-xl p-6 bg-surface-container-lowest flex flex-col gap-6">
          <h3 className="text-headline-md font-headline-md text-on-surface">Ringkasan Pesanan</h3>

          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-xl bg-surface-container overflow-hidden flex-shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC87nJt4UTWPv2ebTjdiihduGbbF1KtcDhTsTj5QDmjYWAc7U6Wr6NuFRnNc4ImRHFoqVZHfLQW9bKUDT2F-hP64tea6OcGO9tf5ioFIm_guNlMNp4qJS04fmI2Cti53NKq1Tu2XGu30corc3S8dcYpKNP7RGtRAi3Qy5-AwPsNUfOBJGosXsn2FKyP1j6kXCT7akni73-1yUj656v-xfYbl9_WR7Q2Zr-AAd7snMICqpWVI-ntsX5H_Q"
                alt="Package Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-label-md font-label-md uppercase text-on-surface-variant mb-1">LAYANAN</div>
              <div className="text-body-lg font-body-lg font-medium text-on-surface">{packageData.name}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-4 border-y border-outline-variant">
            <div className="flex justify-between items-center text-body-md font-body-md text-on-surface-variant">
              <span>Waktu Pengerjaan</span>
              <span className="text-on-surface">3-5 hari</span>
            </div>
            <div className="flex justify-between items-center text-body-md font-body-md text-on-surface-variant">
              <span>Harga Dasar</span>
              <span className="text-on-surface">Rp {packageData.price.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <span className="text-headline-md font-headline-md text-on-surface">Total</span>
            <span className="text-headline-lg font-headline-lg text-primary">Rp {packageData.price.toLocaleString('id-ID')}</span>
          </div>

          {error && (
            <div className="p-3 bg-error-container border border-error/20 text-error rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading || isUploading || status === "loading"}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md text-label-md uppercase tracking-wider hover:bg-surface-tint transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 0" }}>progress_activity</span> Membuat Pesanan...</>
              ) : isUploading ? "Mengunggah file..." : status === "unauthenticated" ? "Masuk untuk Pesan" : "Buat Pesanan"}
            </button>
            <p className="text-caption font-caption text-on-surface-variant text-center mt-2">
              Dengan membuat pesanan, Anda menyetujui <br />
              <span className="flex items-center justify-center gap-1 mt-1">
                <input
                  type="checkbox"
                  id="terms-sidebar"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-primary bg-transparent border-outline-variant rounded focus:ring-primary focus:ring-2 cursor-pointer"
                />
                <label htmlFor="terms-sidebar" className="cursor-pointer">
                  <a href="#" className="underline hover:text-primary">Ketentuan Layanan</a> dan <a href="#" className="underline hover:text-primary">Kebijakan Commission</a>.
                </label>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
