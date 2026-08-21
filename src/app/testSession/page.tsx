"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function TestSessionPage() {
  const { data: session, status } = useSession();
  const [packages, setPackages] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch('/api/packages')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setPackages(data.data);
          }
        })
        .catch(err => console.error("Failed to load packages:", err));
    }
  }, [status]);

  if (status === "loading") {
    return <div className="p-8">Loading session...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Anda belum login</h1>
        <p>Silakan login terlebih dahulu untuk melihat data session.</p>
        <a href="/login" className="text-blue-500 underline mt-4 inline-block">
          Pergi ke Halaman Login
        </a>
      </div>
    );
  }

  const handleTestOrder = async (packageId: string) => {
    setLoading(true);
    setOrderStatus("Membuat pesanan...");
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageId,
          brief: "Ini adalah pesanan test dari halaman testSession",
          buyerInfo: {
            first_name: session?.user?.name || "Test Buyer",
            email: session?.user?.email || "test@example.com",
            phone: "08123456789"
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setOrderStatus(`SUKSES! Pesanan Dibuat.\nOrder ID: ${data.data.order.id}\nMidtrans Token: ${data.data.paymentInfo.token}\nMidtrans URL: ${data.data.paymentInfo.redirectUrl}`);
      } else {
        setOrderStatus(`GAGAL: ${JSON.stringify(data.message || data)}`);
      }
    } catch (err: any) {
      setOrderStatus(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-green-500 mb-4">Anda sudah login!</h1>
      
      <div className="bg-gray-100 p-4 rounded-md text-black overflow-auto mb-6">
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>

      <div className="border p-6 rounded-md mb-6 bg-white dark:bg-zinc-900">
        <h2 className="text-xl font-bold mb-4">Uji Coba API Order & Midtrans</h2>
        <p className="mb-4 text-sm text-gray-500">
          Untuk mengetes ini, pastikan Anda sudah memasukkan <b>MIDTRANS_SERVER_KEY</b> dan <b>MIDTRANS_CLIENT_KEY</b> di file <code>.env</code> Anda, dan me-restart server.
        </p>

        {packages.length === 0 ? (
          <p className="text-red-500 text-sm">Belum ada Package di database. Buat Package terlebih dahulu untuk bisa mencoba order.</p>
        ) : (
          <div className="space-y-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-bold">{pkg.name}</h3>
                  <p className="text-sm">Rp {pkg.price}</p>
                </div>
                <button 
                  onClick={() => handleTestOrder(pkg.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Test Order Package Ini
                </button>
              </div>
            ))}
          </div>
        )}

        {orderStatus && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-zinc-800 rounded">
            <pre className="whitespace-pre-wrap text-sm">{orderStatus}</pre>
          </div>
        )}
      </div>

      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  );
}