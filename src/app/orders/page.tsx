"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface OrderSummary {
  id: string;
  packageId: string;
  packageName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
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

export default function BuyerOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (sessionStatus === 'authenticated') {
      fetchOrders();
    }
  }, [sessionStatus, router]);

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

  if (sessionStatus === 'loading' || (loading && !error)) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#DDD7CE] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-secondary)]">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[var(--spacing-container-max)] mx-auto px-6 md:px-[var(--spacing-gutter)] py-12">
      <div className="mb-10 border-b border-[var(--color-border-line)] pb-6">
        <h1 className="text-3xl font-headline-lg font-bold text-[var(--color-primary)] mb-2">Pesanan Saya</h1>
        <p className="text-[var(--color-secondary)] font-body-md">Lacak status komisi karya digital Anda.</p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-800 p-6 rounded border border-red-200 text-center max-w-xl mx-auto">
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchOrders}
            className="bg-white border border-red-200 text-red-800 px-4 py-2 rounded font-label-md hover:bg-red-100 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-[var(--color-border-line)] rounded bg-[var(--color-surface)]">
          <span className="material-symbols-outlined text-4xl text-[var(--color-secondary)] mb-4">inbox</span>
          <h2 className="text-xl font-headline-md font-semibold text-[var(--color-primary)] mb-2">Belum Ada Pesanan</h2>
          <p className="text-[var(--color-secondary)] mb-6">Anda belum memiliki pesanan komisi saat ini.</p>
          <Link 
            href="/packages"
            className="inline-block bg-[var(--color-primary)] text-white px-6 py-3 rounded text-sm font-label-md hover:bg-[#3A332F] transition-colors"
          >
            Jelajahi Komisi
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-[var(--color-border-line)] rounded bg-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-headline-md font-semibold text-[var(--color-primary)]">{order.packageName}</h3>
                  <span className="text-xs bg-[#F5F1EA] text-[#55423E] px-2 py-1 rounded font-medium border border-[#DDD7CE]">
                    {mapStatusToIndonesian(order.status)}
                  </span>
                </div>
                
                <div className="text-sm text-[var(--color-secondary)] grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-[#A39E98] mb-1">ID Pesanan</span>
                    <span className="font-mono">{order.id.split('-')[0]}...</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-[#A39E98] mb-1">Tanggal Dibuat</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-[#A39E98] mb-1">Total Harga</span>
                    <span className="font-semibold text-[var(--color-primary)]">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-[#A39E98] mb-1">Pembayaran</span>
                    <span className={order.paymentStatus === 'SUCCESS' ? 'text-green-600 font-medium' : 'text-[#B85C45] font-medium'}>
                      {mapPaymentStatusToIndonesian(order.paymentStatus)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto mt-4 md:mt-0 flex shrink-0">
                <Link 
                  href={`/orders/${order.id}`}
                  className="w-full md:w-auto text-center border border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-2 rounded text-sm font-label-md hover:bg-[#F5F1EA] transition-colors"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
