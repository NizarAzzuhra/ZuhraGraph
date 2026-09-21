import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import OrderStatusUpdater from "@/components/admin/OrderStatusUpdater";
import AdminArtworkUploadForm from "./AdminArtworkUploadForm";
import AdminRevisionActions from "./AdminRevisionActions";

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await props.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: true,
      package: true,
      revisionRequests: { orderBy: { createdAt: 'desc' } },
      artworkVersions: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!order) {
    notFound();
  }

  let parsedBrief: any = null;
  try {
    const parsed = JSON.parse(order.brief);
    if (parsed && typeof parsed === 'object') {
      parsedBrief = parsed;
    }
  } catch (e) {
    parsedBrief = { description: order.brief, characterReferences: [], designReferences: [], additionalReferences: [] };
  }

  const renderImageGrid = (title: string, urls: string[]) => {
    if (!urls || urls.length === 0) return null;
    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-[var(--color-secondary)] uppercase mb-2">{title}</h4>
        <div className="flex flex-wrap gap-3">
          {urls.map((url, idx) => (
            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-[#DDD7CE] hover:opacity-80 transition-opacity">
              <img src={url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  const pendingRevision = order.revisionRequests?.find(r => r.status === 'PENDING');

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-12">
      <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)] mb-6 transition-colors">
        <span className="material-symbols-outlined text-sm mr-1">arrow_back</span>
        Kembali ke Pesanan
      </Link>

      {/* Announcement Banner */}
      {order.revisionRequests?.some(r => r.status === 'APPROVED_PAID') && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="text-sm font-semibold text-emerald-800 uppercase">Revisi Berbayar Disetujui & Dibayar oleh Buyer - Siap Dikerjakan</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
          {/* Order Summary & Brief */}
          <section className="bg-white border border-[#DDD7CE] rounded p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#DDD7CE]">
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-1">Pesanan #{order.id}</h2>
                <p className="text-sm text-[var(--color-secondary)]">Dipesan pada {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-secondary)] uppercase mb-3">Detail Klien</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1EA] flex items-center justify-center font-bold text-[#B85C45]">
                    {order.buyer.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--color-primary)]">{order.buyer.name}</div>
                    <div className="text-sm text-[var(--color-secondary)]">{order.buyer.email}</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--color-secondary)] uppercase mb-3">Informasi Paket</h3>
                <div className="font-medium text-[var(--color-primary)]">{order.package.name}</div>
                <div className="text-sm text-[var(--color-secondary)] mt-1">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[var(--color-secondary)] uppercase mb-3">Brief Awal & Catatan Proyek</h3>
              <p className="text-[var(--color-primary)] leading-relaxed whitespace-pre-wrap">
                {parsedBrief?.description || order.brief || "No additional notes provided."}
              </p>
              {parsedBrief?.notes && (
                <p className="text-[var(--color-primary)] leading-relaxed whitespace-pre-wrap mt-4">
                  {parsedBrief.notes}
                </p>
              )}
              {renderImageGrid("Referensi Karakter", parsedBrief?.characterReferences)}
              {renderImageGrid("Referensi Desain", parsedBrief?.designReferences)}
              {renderImageGrid("Referensi Tambahan", parsedBrief?.additionalReferences)}
            </div>
          </section>

          {/* Revision Review Form (Only shows if there's a pending request) */}
          {pendingRevision && (
            <AdminRevisionActions orderId={order.id} requestId={pendingRevision.id} description={pendingRevision.description} />
          )}
          
          {/* Revision History */}
          {order.revisionRequests && order.revisionRequests.filter(r => r.status !== 'PENDING').length > 0 && (
            <section className="bg-white border border-[#DDD7CE] rounded p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Revision History</h2>
              <div className="flex flex-col gap-4">
                {order.revisionRequests.filter(r => r.status !== 'PENDING').map(rev => (
                  <div key={rev.id} className="bg-[#F5F1EA] rounded p-4 border border-[#DDD7CE]">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-sm font-semibold text-[var(--color-primary)] uppercase">Revision #{rev.revisionCount}</h3>
                      <span className="text-xs text-[var(--color-secondary)]">{new Date(rev.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-sm text-[var(--color-primary)] italic border-l-2 border-[#B85C45] pl-3 mb-3">
                      {rev.description}
                    </p>
                    <div className="text-sm font-medium text-[var(--color-primary)]">
                      Status: {rev.status} {Number(rev.extraFee) > 0 && <span className="text-[#B85C45]">(+Rp {Number(rev.extraFee).toLocaleString('id-ID')})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Artwork Delivery */}
        <div className="col-span-1 md:col-span-1 flex flex-col gap-8">
          <section className="bg-white border border-[#DDD7CE] rounded p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-6">Artwork Delivery</h2>
            
            {/* Upload Form Component */}
            <AdminArtworkUploadForm orderId={order.id} currentStatus={order.status} />

            <div>
              <h3 className="text-xs font-semibold text-[var(--color-secondary)] uppercase mb-4 pb-2 border-b border-[#DDD7CE]">Riwayat Pengiriman Desain</h3>
              {order.artworkVersions && order.artworkVersions.length > 0 ? (
                <ul className="flex flex-col gap-6">
                  {order.artworkVersions.map((art, index) => (
                    <li key={art.id} className={`flex flex-col gap-2 ${index > 0 ? "opacity-80" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${index === 0 ? "bg-[#B85C45]" : "bg-[#DDD7CE]"}`}></div>
                        <div className="flex-1 w-full overflow-hidden">
                          <div className="mb-2">
                            <div className="text-sm font-bold text-[var(--color-primary)]">
                              Versi {art.revisionNumber}
                            </div>
                            <div className="text-xs text-[var(--color-secondary)] mt-0.5">
                              {new Date(art.createdAt).toLocaleDateString()} at {new Date(art.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          
                          {art.url && (
                            <div className="mt-2">
                              <img 
                                src={art.url} 
                                alt={`Artwork Versi ${art.revisionNumber}`} 
                                className="w-full h-auto object-cover rounded border border-[#DDD7CE] mb-2" 
                              />
                              <div className="flex items-center justify-between bg-[#F5F1EA] p-2.5 rounded border border-[#DDD7CE]">
                                <span className="text-xs text-[var(--color-primary)] truncate flex-1 mr-2" title={art.url.split('/').pop()}>
                                  {art.url.split('/').pop()}
                                </span>
                                <a 
                                  href={art.url} 
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#B85C45] hover:opacity-70 transition-opacity bg-white border border-[#DDD7CE] px-3 py-1.5 rounded shadow-sm"
                                >
                                  <span className="material-symbols-outlined text-sm">download</span>
                                  Unduh Desain
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--color-secondary)]">No deliveries yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
