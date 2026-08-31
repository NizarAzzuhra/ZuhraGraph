import { prisma } from "@/lib/prisma";
import ToggleCommissionButton from "@/components/ToggleCommissionButton";
import DeletePackageButton from "@/components/admin/DeletePackageButton";
import Link from "next/link";
import Image from "next/image";

export default async function AdminPackagesPage() {
  const packages = await prisma.package.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1F1C18] mb-2">Manajemen Paket & Kuota</h1>
          <p className="text-[#7A7067]">Atur status penerimaan komisi dan kelola daftar paket Anda di sini.</p>
        </div>
        <Link 
          href="/admin/packages/create"
          className="bg-[#9D4B36] hover:bg-[#853E2C] text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          Tambah Paket
        </Link>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4EFEA] border-b border-[#E8E0D5] text-xs uppercase tracking-wider text-[#7A7067]">
              <th className="p-5 font-bold">Paket</th>
              <th className="p-5 font-bold">Harga</th>
              <th className="p-5 font-bold text-center">Batas Slot</th>
              <th className="p-5 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E0D5]">
            {packages.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#7A7067]">Belum ada paket komisi.</td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-[#FAF6F0] transition-colors">
                  <td className="p-5">
                    <div className="flex items-center space-x-4">
                      {pkg.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#E8E0D5] flex-shrink-0">
                          <Image src={pkg.imageUrl} alt={pkg.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#F4EFEA] border border-[#E8E0D5] flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#7A7067]">image</span>
                        </div>
                      )}
                      <span className="font-semibold text-[#1F1C18]">{pkg.name}</span>
                    </div>
                  </td>
                  <td className="p-5 text-[#7A7067]">Rp {Number(pkg.price).toLocaleString("id-ID")}</td>
                  <td className="p-5 text-center font-medium text-[#1F1C18]">{pkg.maxActiveSlots} Slot</td>
                  <td className="p-5">
                    <div className="flex justify-end items-center space-x-2">
                      <ToggleCommissionButton packageId={pkg.id} initialStatus={pkg.isAcceptingOrders} />
                      
                      <Link
                        href={`/admin/packages/${pkg.id}/edit`}
                        className="p-2 text-[#7A7067] hover:text-[#9D4B36] hover:bg-[#FDF5F3] rounded-lg transition-colors flex items-center justify-center"
                        title="Edit Paket"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>

                      <DeletePackageButton packageId={pkg.id} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
