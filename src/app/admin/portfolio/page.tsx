import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/auth";
import DeletePortfolioButton from "@/components/admin/DeletePortfolioButton";
import Link from "next/link";
import Image from "next/image";

export default async function AdminPortfolioPage() {
  await requireAdminPage();

  const portfolios = await prisma.portfolio.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1F1C18] mb-2">Manajemen Portofolio</h1>
          <p className="text-[#7A7067]">Kelola karya-karya portofolio yang akan ditampilkan ke klien.</p>
        </div>
        <Link 
          href="/admin/portfolio/create"
          className="bg-[#9D4B36] hover:bg-[#853E2C] text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center"
        >
          <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
          Tambah Portofolio
        </Link>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4EFEA] border-b border-[#E8E0D5] text-xs uppercase tracking-wider text-[#7A7067]">
              <th className="p-5 font-bold">Karya</th>
              <th className="p-5 font-bold">Kategori</th>
              <th className="p-5 font-bold">Ditambahkan Pada</th>
              <th className="p-5 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E0D5]">
            {portfolios.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#7A7067]">Belum ada portofolio.</td>
              </tr>
            ) : (
              portfolios.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF6F0] transition-colors">
                  <td className="p-5">
                    <div className="flex items-center space-x-4">
                      {item.imageUrl ? (
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-[#E8E0D5] flex-shrink-0 bg-[#F4EFEA]">
                          <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-[#F4EFEA] border border-[#E8E0D5] flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#7A7067]">image</span>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-[#1F1C18] block">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-[#7A7067] line-clamp-1">{item.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-[#FDF5F3] text-[#9D4B36] border border-[#F4E3DF] rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {item.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="p-5 text-[#7A7067] text-sm">
                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-end items-center space-x-2">
                      <Link
                        href={`/admin/portfolio/${item.id}/edit`}
                        className="p-2 text-[#7A7067] hover:text-[#9D4B36] hover:bg-[#FDF5F3] rounded-lg transition-colors flex items-center justify-center"
                        title="Edit Portofolio"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                      <DeletePortfolioButton portfolioId={item.id} />
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
