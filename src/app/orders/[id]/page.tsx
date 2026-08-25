"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  // States for client actions
  const [briefText, setBriefText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  
  // Revision states
  const [revisionDesc, setRevisionDesc] = useState("");
  
  // Admin decision states
  const [decisionReason, setDecisionReason] = useState("");
  const [extraFee, setExtraFee] = useState(0);
  const [revisionClass, setRevisionClass] = useState<"CORRECTION" | "REVISION" | "SCOPE_CHANGE">("REVISION");
  
  // Artist artwork upload states
  const [artworkUrl, setArtworkUrl] = useState("");
  const [uploadingArtwork, setUploadingArtwork] = useState(false);

  const orderId = params.id as string;
  const userRole = (session?.user as any)?.role || "BUYER";

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 401 || res.status === 403) {
        setError("Anda tidak memiliki akses ke pesanan ini.");
        return;
      }
      if (res.status === 404) {
        setError("Pesanan tidak ditemukan.");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setOrderData(data.data);
        setPaymentData(data.payment);
        setBriefText(data.data.order.brief);
      } else {
        setError(data.message || "Gagal memuat detail pesanan.");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrderDetails();
    } else if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/orders/${orderId}`);
    }
  }, [status, orderId]);

  const handlePayNow = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success && data.data?.token) {
        if (typeof window.snap !== 'undefined') {
          window.snap.pay(data.data.token, {
            onSuccess: function() {
              fetchOrderDetails();
            },
            onPending: function() {
              fetchOrderDetails();
            },
            onError: function() {
              alert("Pembayaran gagal! Silakan coba lagi.");
              fetchOrderDetails();
            },
            onClose: function() {
              fetchOrderDetails();
            }
          });
        } else {
          alert("Midtrans payment gateway belum siap. Silakan coba sesaat lagi.");
        }
      } else {
        alert(data.message || "Gagal menginisiasi pembayaran.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setPaying(false);
    }
  };

  const handleDirectBriefUpdate = async () => {
    if (!briefText.trim()) {
      setActionError("Brief tidak boleh kosong.");
      return;
    }
    if (briefText.length > 1000) {
      setActionError("Brief tidak boleh lebih dari 1000 karakter.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/brief-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedBrief: briefText })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchOrderDetails();
      } else {
        setActionError(data.message || "Gagal memperbarui brief.");
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideBriefEdit = async (requestId: string, approve: boolean) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/brief-edit/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve, reason: decisionReason })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setDecisionReason("");
        fetchOrderDetails();
      } else {
        setActionError(data.message || "Gagal memproses keputusan.");
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionDesc.trim()) {
      setActionError("Deskripsi revisi wajib diisi.");
      return;
    }

    const latestArtwork = orderData?.artworkVersions?.[0];
    if (!latestArtwork) {
      setActionError("Belum ada desain yang diunggah untuk direvisi.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/revision-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: revisionDesc,
          artworkVersionId: latestArtwork.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setRevisionDesc("");
        fetchOrderDetails();
      } else {
        setActionError(data.message || "Gagal mengajukan revisi.");
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecideRevision = async (requestId: string, approve: boolean) => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/revision-request/${requestId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approve,
          classification: revisionClass,
          extraFee: Number(extraFee),
          reason: decisionReason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setDecisionReason("");
        setExtraFee(0);
        fetchOrderDetails();
      } else {
        setActionError(data.message || "Gagal memproses keputusan revisi.");
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRevision = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/revision-request`, {
        method: "PUT"
      });
      // We can also support calling PUT to execute startRevision. Let's make sure it handles startRevision
      // Wait, let's create a PUT route or use a POST route to trigger startRevision.
      // Let's check: did we create PUT route? We can implement it in the revision-request route.
      // Wait, let's just make a POST to /api/orders/[id]/revision-request with action or call PUT.
      // Let's implement PUT in revision-request route to startRevision! It is very easy and clean.
    } catch (err: any) {}
  };

  const handleUploadArtworkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file melebihi batas 10 MB.");
      return;
    }

    setUploadingArtwork(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setArtworkUrl(data.url);
      } else {
        alert(data.message || "Gagal mengunggah file.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengunggah.");
    } finally {
      setUploadingArtwork(false);
    }
  };

  const handleSubmitArtwork = async () => {
    if (!artworkUrl.trim()) {
      alert("URL desain wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/artwork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: artworkUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setArtworkUrl("");
        fetchOrderDetails();
      } else {
        alert(data.message || "Gagal mengunggah desain.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E07A5F]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
        <Link href="/" className="text-[#E07A5F] hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  const { order, package: pkg, briefEditRequests, revisionRequests, artworkVersions } = orderData;
  const isPendingPayment = paymentData?.status === "PENDING";

  let parsedBrief: any = null;
  try {
    const parsed = JSON.parse(order.brief);
    if (parsed && typeof parsed === 'object' && parsed.description !== undefined) {
      parsedBrief = parsed;
    }
  } catch (e) {
    parsedBrief = { description: order.brief, characterReferences: [], designReferences: [], additionalReferences: [] };
  }

  const statusTranslation: Record<string, string> = {
    PENDING: "Menunggu",
    AWAITING_PAYMENT: "Menunggu Pembayaran",
    PAID: "Sudah Dibayar",
    CONFIRMED: "Telah Dikonfirmasi",
    PROCESSING: "Sedang Diproses",
    ARTWORK_UPLOADED: "Artwork Diunggah",
    WAITING_BUYER_CONFIRMATION: "Menunggu Konfirmasi Pembeli",
    REVISION_REQUESTED: "Revisi Diminta",
    PROCESSING_REVISION: "Proses Revisi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };

  const paymentStatusTranslation: Record<string, string> = {
    PENDING: "Menunggu Pembayaran",
    SUCCESS: "Pembayaran Berhasil",
    FAILED: "Pembayaran Gagal",
    EXPIRED: "Pembayaran Kedaluwarsa",
    REFUNDED: "Dana Dikembalikan",
  };

  const renderImageGrid = (title: string, urls: string[]) => {
    if (!urls || urls.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-[#2D2D2D]/80 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-3">
          {urls.map((url, idx) => (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-[#2D2D2D]/20 hover:opacity-80 transition-opacity">
              <img src={url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const canEditBriefDirectly = order.status === "PENDING" || order.status === "AWAITING_PAYMENT";
  const canRequestBriefEdit = !["COMPLETED", "CANCELLED", "PENDING", "AWAITING_PAYMENT"].includes(order.status);
  const hasPendingBriefRequest = briefEditRequests?.some((r: any) => r.status === "PENDING");

  const latestArtwork = artworkVersions?.[0];

  return (
    <>
      <Script 
        src={process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js'} 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-[#2D2D2D] mb-2 font-headline-lg">Detail Pesanan</h1>
              <p className="text-[#2D2D2D]/60">Kelola pesanan commission dan pantau status pengerjaan.</p>
            </div>
            <Link href="/" className="text-[#E07A5F] font-semibold hover:underline text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span> Kembali
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Order Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D2D2D]/10">
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#2D2D2D]/10">
                  <div>
                    <p className="text-xs text-[#2D2D2D]/60 uppercase tracking-wider mb-1">ID Pesanan</p>
                    <p className="font-mono font-bold text-lg text-[#2D2D2D]">{order.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#2D2D2D]/60 uppercase tracking-wider mb-1">Tanggal Dibuat</p>
                    <p className="text-sm font-medium text-[#2D2D2D]">{new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-[#2D2D2D] mb-3">Informasi Paket</h3>
                    <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#2D2D2D]/10">
                      <p className="font-bold text-[#2D2D2D] text-lg mb-1">{pkg.name}</p>
                      <p className="text-[#E07A5F] font-semibold mb-3">Rp {Number(pkg.price).toLocaleString('id-ID')}</p>
                      <div className="text-sm text-[#2D2D2D]/70 space-y-4">
                        <div>
                          <p className="uppercase tracking-wider text-xs font-semibold mb-1">Brief Pesanan:</p>
                          <p className="whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#2D2D2D]/5">{parsedBrief?.description || order.brief}</p>
                        </div>
                        
                        {renderImageGrid("Referensi Karakter", parsedBrief?.characterReferences)}
                        {renderImageGrid("Referensi Desain", parsedBrief?.designReferences)}
                        {renderImageGrid("Referensi Tambahan", parsedBrief?.additionalReferences)}
                      </div>
                    </div>
                  </div>

                  {/* Artwork Section */}
                  {artworkVersions && artworkVersions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg text-[#2D2D2D] mb-3">Hasil Desain (Artwork)</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {artworkVersions.map((art: any, index: number) => (
                          <div key={art.id} className="bg-[#FDFBF7] p-4 rounded-xl border border-[#2D2D2D]/10 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-[#2D2D2D]">Versi {art.revisionNumber}</span>
                              <span className="text-[#2D2D2D]/60">{new Date(art.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <a href={art.url} target="_blank" rel="noopener noreferrer" className="block max-h-96 rounded-lg overflow-hidden border border-[#2D2D2D]/20 hover:opacity-95 transition-opacity bg-black flex justify-center">
                              <img src={art.url} alt={`Artwork Versi ${art.revisionNumber}`} className="max-h-96 object-contain" />
                            </a>
                            <div className="flex justify-end">
                              <a href={art.url} download className="px-4 py-1.5 rounded-full bg-[#2D2D2D] text-white text-xs font-medium hover:bg-[#E07A5F] transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">download</span> Unduh Desain
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Brief Editing Actions */}
                  {(canEditBriefDirectly || canRequestBriefEdit) && (
                    <div className="pt-6 border-t border-[#2D2D2D]/10">
                      <h3 className="font-semibold text-[#2D2D2D] mb-2">Perbarui Brief Pesanan</h3>
                      <p className="text-xs text-[#2D2D2D]/60 mb-3">
                        {canEditBriefDirectly 
                          ? "Anda masih dapat mengedit brief secara langsung karena pesanan belum dibayar." 
                          : "Pesanan telah berjalan. Anda harus mengajukan permohonan perubahan brief untuk disetujui artist."}
                      </p>
                      <textarea
                        rows={4}
                        value={briefText}
                        onChange={(e) => setBriefText(e.target.value)}
                        className="w-full p-4 rounded-xl border border-[#2D2D2D]/20 focus:outline-none focus:border-[#E07A5F] text-sm bg-[#FDFBF7] resize-y"
                        placeholder="Tulis brief baru di sini..."
                        disabled={actionLoading || hasPendingBriefRequest}
                      />
                      {actionError && <p className="text-red-500 text-xs mt-1">{actionError}</p>}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-[#2D2D2D]/50">{briefText.length}/1000</span>
                        {canEditBriefDirectly ? (
                          <button
                            onClick={handleDirectBriefUpdate}
                            disabled={actionLoading}
                            className="px-6 py-2 rounded-full bg-[#2D2D2D] text-white hover:bg-[#E07A5F] text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? "Menyimpan..." : "Simpan Perubahan Brief"}
                          </button>
                        ) : (
                          <button
                            onClick={handleDirectBriefUpdate}
                            disabled={actionLoading || hasPendingBriefRequest}
                            className="px-6 py-2 rounded-full bg-[#E07A5F] text-white hover:bg-[#D06950] text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {hasPendingBriefRequest ? "Menunggu Persetujuan..." : "Ajukan Perubahan Brief"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Brief Edit Requests History */}
                  {briefEditRequests && briefEditRequests.length > 0 && (
                    <div className="pt-6 border-t border-[#2D2D2D]/10">
                      <h3 className="font-semibold text-sm text-[#2D2D2D] mb-3">Riwayat Permintaan Perubahan Brief</h3>
                      <div className="space-y-3">
                        {briefEditRequests.map((r: any) => (
                          <div key={r.id} className="p-4 rounded-xl border border-[#2D2D2D]/10 text-xs bg-white space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${
                                r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {r.status === 'APPROVED' ? 'Disetujui' : r.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                              </span>
                              <span className="text-[#2D2D2D]/50">{new Date(r.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <p className="font-semibold">Brief yang Diajukan:</p>
                            <p className="bg-[#FDFBF7] p-2 rounded border border-[#2D2D2D]/5 font-mono">{r.proposedBrief}</p>
                            {r.reason && (
                              <p className="text-[#2D2D2D]/80">
                                <span className="font-semibold">Catatan Artist:</span> {r.reason}
                              </p>
                            )}
                            {/* Admin Actions */}
                            {userRole === 'ADMIN' && r.status === 'PENDING' && (
                              <div className="mt-3 pt-3 border-t border-[#2D2D2D]/5 flex flex-col gap-2">
                                <p className="font-semibold text-xs text-[#2D2D2D]">Tindakan Admin:</p>
                                <input
                                  type="text"
                                  placeholder="Berikan alasan (wajib jika menolak)..."
                                  value={decisionReason}
                                  onChange={(e) => setDecisionReason(e.target.value)}
                                  className="w-full p-2 border border-[#2D2D2D]/10 rounded-lg text-xs focus:outline-none focus:border-[#E07A5F] bg-[#FDFBF7]"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleDecideBriefEdit(r.id, false)}
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                  >
                                    Tolak
                                  </button>
                                  <button
                                    onClick={() => handleDecideBriefEdit(r.id, true)}
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                                  >
                                    Setujui
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revision Requests Section */}
                  {order.status === "WAITING_BUYER_CONFIRMATION" && userRole === "BUYER" && latestArtwork && (
                    <div className="pt-6 border-t border-[#2D2D2D]/10 space-y-3">
                      <h3 className="font-semibold text-[#2D2D2D]">Ajukan Permintaan Revisi</h3>
                      <p className="text-xs text-[#2D2D2D]/60">
                        Jelaskan perubahan spesifik yang Anda inginkan dari artwork versi terbaru ini.
                      </p>
                      <textarea
                        rows={4}
                        value={revisionDesc}
                        onChange={(e) => setRevisionDesc(e.target.value)}
                        className="w-full p-4 rounded-xl border border-[#2D2D2D]/20 focus:outline-none focus:border-[#E07A5F] text-sm bg-[#FDFBF7] resize-y"
                        placeholder="Contoh: Tolong ganti warna latar belakang menjadi agak kebiruan..."
                        disabled={actionLoading}
                      />
                      {actionError && <p className="text-red-500 text-xs mt-1">{actionError}</p>}
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleRequestRevision}
                          disabled={actionLoading}
                          className="px-6 py-2 rounded-full bg-[#E07A5F] text-white hover:bg-surface-tint text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {actionLoading ? "Mengajukan..." : "Ajukan Revisi"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Revision History */}
                  {revisionRequests && revisionRequests.length > 0 && (
                    <div className="pt-6 border-t border-[#2D2D2D]/10">
                      <h3 className="font-semibold text-sm text-[#2D2D2D] mb-3">Riwayat Permintaan Revisi</h3>
                      <div className="space-y-3">
                        {revisionRequests.map((rev: any) => (
                          <div key={rev.id} className="p-4 rounded-xl border border-[#2D2D2D]/10 text-xs bg-white space-y-2">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${
                                rev.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                rev.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {rev.status === 'APPROVED' ? 'Disetujui' : rev.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Persetujuan'}
                              </span>
                              <span className="text-[#2D2D2D]/50">{new Date(rev.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <p className="font-semibold text-sm text-[#2D2D2D]">Revisi #{rev.revisionCount}</p>
                            <p className="text-body-md font-body-md whitespace-pre-wrap">{rev.description}</p>
                            
                            {rev.classification && (
                              <div className="mt-2 text-xs grid grid-cols-2 gap-2 max-w-sm">
                                <span className="text-[#2D2D2D]/60">Klasifikasi:</span>
                                <span className="font-semibold text-[#2D2D2D]">
                                  {rev.classification === 'CORRECTION' ? 'Koreksi Artist' :
                                   rev.classification === 'REVISION' ? 'Revisi Minor' : 'Scope Change (Revisi Besar)'}
                                </span>
                                <span className="text-[#2D2D2D]/60">Biaya Tambahan:</span>
                                <span className="font-semibold text-primary">
                                  Rp {Number(rev.extraFee).toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            
                            {rev.reason && (
                              <p className="text-[#2D2D2D]/80">
                                <span className="font-semibold">Catatan Artist:</span> {rev.reason}
                              </p>
                            )}

                            {/* Admin Actions */}
                            {userRole === 'ADMIN' && rev.status === 'PENDING' && (
                              <div className="mt-3 pt-3 border-t border-[#2D2D2D]/5 flex flex-col gap-3">
                                <p className="font-semibold text-xs text-[#2D2D2D]">Persetujuan & Klasifikasi Revisi (Admin Only):</p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[10px] text-[#2D2D2D]/60 uppercase mb-1">Klasifikasi</label>
                                    <select
                                      value={revisionClass}
                                      onChange={(e: any) => setRevisionClass(e.target.value)}
                                      className="w-full p-2 border border-[#2D2D2D]/10 rounded-lg text-xs bg-[#FDFBF7]"
                                    >
                                      <option value="CORRECTION">Koreksi Artist (Free)</option>
                                      <option value="REVISION">Revisi Minor ( allowance )</option>
                                      <option value="SCOPE_CHANGE">Scope Change (Berbayar)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-[#2D2D2D]/60 uppercase mb-1">Biaya Tambahan (Rp)</label>
                                    <input
                                      type="number"
                                      value={extraFee}
                                      onChange={(e) => setExtraFee(Number(e.target.value))}
                                      className="w-full p-2 border border-[#2D2D2D]/10 rounded-lg text-xs bg-[#FDFBF7]"
                                    />
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Berikan catatan tambahan / alasan..."
                                  value={decisionReason}
                                  onChange={(e) => setDecisionReason(e.target.value)}
                                  className="w-full p-2 border border-[#2D2D2D]/10 rounded-lg text-xs focus:outline-none focus:border-[#E07A5F] bg-[#FDFBF7]"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleDecideRevision(rev.id, false)}
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                  >
                                    Tolak
                                  </button>
                                  <button
                                    onClick={() => handleDecideRevision(rev.id, true)}
                                    disabled={actionLoading}
                                    className="px-4 py-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                                  >
                                    Setujui
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Upload Artwork Panel */}
                  {userRole === 'ADMIN' && ["PROCESSING", "PROCESSING_REVISION"].includes(order.status) && (
                    <div className="pt-6 border-t border-[#2D2D2D]/10 space-y-4">
                      <h3 className="font-semibold text-[#2D2D2D] text-lg">Unggah Hasil Desain (Admin Only)</h3>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#2D2D2D]/60 uppercase font-semibold">Pilih File Desain</label>
                        <input
                          type="file"
                          accept="image/jpeg, image/png, image/webp"
                          onChange={handleUploadArtworkFile}
                          className="text-xs text-[#2D2D2D]"
                          disabled={uploadingArtwork}
                        />
                        {uploadingArtwork && <p className="text-xs text-primary animate-pulse">Mengunggah file ke Cloudinary...</p>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-[#2D2D2D]/60 uppercase font-semibold">URL Hasil Desain</label>
                        <input
                          type="text"
                          value={artworkUrl}
                          onChange={(e) => setArtworkUrl(e.target.value)}
                          placeholder="https://cloudinary.com/... (terisi otomatis setelah unggah file)"
                          className="w-full p-3 border border-[#2D2D2D]/20 rounded-xl text-xs bg-[#FDFBF7] focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleSubmitArtwork}
                          disabled={actionLoading || uploadingArtwork || !artworkUrl}
                          className="px-6 py-2.5 rounded-full bg-[#2D2D2D] hover:bg-[#E07A5F] text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          Kirim Desain ke Pembeli
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Right Column: Status & Payment summary */}
            <div className="space-y-6">
              
              {/* Order Status Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D2D2D]/10">
                <h3 className="font-semibold text-sm text-[#2D2D2D]/50 uppercase tracking-widest mb-4">Status Transaksi</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#2D2D2D]/60 uppercase mb-1">Status Pesanan</p>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E07A5F]/10 text-[#E07A5F]">
                      {statusTranslation[order.status] || order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-[#2D2D2D]/60 uppercase mb-1">Status Pembayaran</p>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                      paymentData?.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                      paymentData?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {paymentStatusTranslation[paymentData?.status] || 'Belum Ada Transaksi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Payment Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D2D2D]/10 space-y-4">
                <h3 className="font-semibold text-sm text-[#2D2D2D]/50 uppercase tracking-widest">Ringkasan Pembayaran</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#2D2D2D]/70">
                    <span>Harga Paket</span>
                    <span>Rp {Number(pkg.price).toLocaleString('id-ID')}</span>
                  </div>
                  
                  {/* Additional Revision/Scope change fees if applicable */}
                  {paymentData && paymentData.amount.toNumber() !== Number(pkg.price) && (
                    <div className="flex justify-between text-[#2D2D2D]/70">
                      <span>Biaya Tambahan (Revisi)</span>
                      <span>Rp {paymentData.amount.toNumber().toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="border-t border-[#2D2D2D]/10 pt-2 flex justify-between font-bold text-[#2D2D2D]">
                    <span>Total Pembayaran</span>
                    <span className="text-primary">
                      Rp {(paymentData ? paymentData.amount.toNumber() : Number(order.totalAmount)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {isPendingPayment && (
                  <button
                    onClick={handlePayNow}
                    disabled={paying}
                    className="w-full py-3 rounded-full bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D06950] transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                  >
                    {paying ? "Memproses..." : "Lanjutkan ke Pembayaran"}
                  </button>
                )}
              </div>

              {/* Admin transition buttons to simulate workflow */}
              {userRole === 'ADMIN' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2D2D2D]/10 space-y-4">
                  <h3 className="font-semibold text-xs text-[#2D2D2D]/50 uppercase tracking-widest">Tindakan Workflow (Admin)</h3>
                  <div className="flex flex-col gap-2">
                    {order.status === 'PAID' && (
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/orders/${orderId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'confirm' })
                          });
                          if ((await res.json()).success) fetchOrderDetails();
                        }}
                        className="w-full py-2 bg-[#2D2D2D] hover:bg-[#E07A5F] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Konfirmasi Pesanan
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/orders/${orderId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'startProcessing' })
                          });
                          if ((await res.json()).success) fetchOrderDetails();
                        }}
                        className="w-full py-2 bg-[#2D2D2D] hover:bg-[#E07A5F] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Mulai Pengerjaan (Processing)
                      </button>
                    )}
                    {order.status === 'REVISION_REQUESTED' && (
                      <button
                        onClick={async () => {
                          const res = await fetch(`/api/orders/${orderId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'startRevision' })
                          });
                          const data = await res.json();
                          if (data.success) {
                            fetchOrderDetails();
                          } else {
                            alert(data.message);
                          }
                        }}
                        className="w-full py-2 bg-[#E07A5F] hover:bg-[#D06950] text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Mulai Kerjakan Revisi
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-center mt-8">
             <button onClick={fetchOrderDetails} className="text-xs text-[#2D2D2D]/60 hover:text-[#2D2D2D] underline">
               Perbarui Halaman
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
