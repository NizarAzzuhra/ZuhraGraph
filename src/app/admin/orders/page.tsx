"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OrderStatusUpdater from '@/components/admin/OrderStatusUpdater';

interface OrderSummary {
  id: string;
  packageId: string;
  packageName: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
  revisionRequests?: any[];
}

const mapStatusToIndonesian = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'Menunggu',
    AWAITING_PAYMENT: 'Menunggu Pembayaran',
    PAID: 'Sudah Dibayar',
    CONFIRMED: 'Dikonfirmasi',
    PROCESSING: 'Sedang Diproses',
    ARTWORK_UPLOADED: 'Artwork Telah Diupload',
    WAITING_BUYER_CONFIRMATION: 'Menunggu Konfirmasi',
    REVISION_REQUESTED: 'Revisi Diminta',
    PROCESSING_REVISION: 'Sedang Direvisi',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan'
  };
  return map[status] || status;
};

const mapPaymentStatusToIndonesian = (status: string | null) => {
  if (!status) return 'Belum Ada';
  const map: Record<string, string> = {
    PENDING: 'Tertunda',
    SUCCESS: 'Berhasil',
    FAILED: 'Gagal',
    EXPIRED: 'Kedaluwarsa',
    REFUNDED: 'Dikembalikan'
  };
  return map[status] || status;
};

export default function AdminOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sederhana filter implementation
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (sessionStatus === 'authenticated') {
      if ((session.user as any).role !== 'ADMIN') {
        router.push('/'); // Redirect non-admins
        return;
      }
      fetchOrders();
    }
  }, [sessionStatus, router, session]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memuat pesanan');
      }
      
      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true;
    if (filter === 'WAITING') return ['PENDING', 'AWAITING_PAYMENT', 'WAITING_BUYER_CONFIRMATION'].includes(order.status);
    if (filter === 'ACTIVE') return ['PAID', 'CONFIRMED', 'PROCESSING', 'REVISION_REQUESTED', 'PROCESSING_REVISION'].includes(order.status);
    if (filter === 'COMPLETED') return ['COMPLETED'].includes(order.status);
    return true;
  });

  if (sessionStatus === 'loading' || (loading && !error)) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#DDD7CE] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-secondary)]">Memuat data dasbor...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if not admin, avoids flash of content before redirect
  if (sessionStatus === 'authenticated' && (session.user as any).role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-12">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2">Dasbor Pesanan</h1>
          <p className="text-[var(--color-secondary)]">Kelola semua pesanan masuk dan status komisi.</p>
        </div>
        
        {/* Simple Filter */}
        <div className="flex bg-[#F5F1EA] p-1 rounded border border-[#DDD7CE]">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'ALL' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'ACTIVE' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
          >
            Aktif
          </button>
          <button 
            onClick={() => setFilter('WAITING')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'WAITING' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
          >
            Menunggu
          </button>
          <button 
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${filter === 'COMPLETED' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'}`}
          >
            Selesai
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-800 p-6 rounded border border-red-200 text-center max-w-xl mx-auto">
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="bg-white border border-red-200 text-red-800 px-4 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 border border-[var(--color-border-line)] rounded bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-4">inventory_2</span>
          <h2 className="text-xl font-semibold text-[var(--color-primary)] mb-2">Tidak Ada Data</h2>
          <p className="text-[var(--color-secondary)]">Belum ada pesanan yang sesuai dengan kriteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-border-line)] bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F1EA] border-b border-[var(--color-border-line)]">
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">ID</th>
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">Pembeli</th>
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">Paket</th>
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">Pembayaran</th>
                <th className="p-4 text-xs font-semibold text-[#55423E] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--color-border-line)] hover:bg-[#FCFAF7] transition-colors">
                  <td className="p-4">
                    <span className="font-mono text-sm text-[var(--color-primary)]" title={order.id}>
                      {order.id.split('-')[0]}...
                    </span>
                    <div className="text-xs text-[var(--color-secondary)] mt-1">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-[var(--color-primary)]">{order.buyerName}</div>
                    <div className="text-xs text-[var(--color-secondary)]">{order.buyerEmail}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-[var(--color-primary)]">{order.packageName}</div>
                    <div className="text-xs text-[var(--color-secondary)] mt-1">
                      Rp {order.totalAmount.toLocaleString('id-ID')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2 items-start">
                      <span className="inline-flex text-xs bg-[#E6E2DE] text-[#242321] px-2 py-1 rounded font-medium border border-[#DDD7CE]">
                        {mapStatusToIndonesian(order.status)}
                      </span>
                      
                      {order.revisionRequests?.[0]?.status === 'APPROVED_PAID' && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                          ⚡ Revisi Dibayar
                        </span>
                      )}
                      {order.revisionRequests?.[0]?.status === 'PENDING' && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
                          ⚠️ Butuh Review Revisi
                        </span>
                      )}
                      {order.revisionRequests?.[0]?.status === 'REQUIRES_PAYMENT' && (
                        <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                          ⏳ Menunggu Pembayaran Buyer
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex text-xs px-2 py-1 rounded font-medium ${order.paymentStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {mapPaymentStatusToIndonesian(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-medium text-[#B85C45] hover:text-[#99442F] transition-colors"
                      >
                        Lihat Detail
                      </Link>
                      <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
