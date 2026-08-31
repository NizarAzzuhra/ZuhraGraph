"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PortfolioData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
}

export default function EditPortfolioForm({ initialData }: { initialData: PortfolioData }) {
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description || "",
    category: initialData.category || "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("description", formData.description);
      formPayload.append("category", formData.category);
      if (image) {
        formPayload.append("image", image);
      }

      const res = await fetch(`/api/admin/portfolio/${initialData.id}`, {
        method: "PATCH",
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui portofolio");
        return;
      }

      router.push("/admin/portfolio");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1F1C18] mb-2">Edit Portofolio</h1>
          <p className="text-[#7A7067]">Perbarui informasi karya portofolio Anda.</p>
        </div>
        <Link href="/admin/portfolio" className="text-[#7A7067] hover:text-[#9D4B36] font-semibold text-sm transition-colors">
          Batal & Kembali
        </Link>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Gambar Karya</label>
            
            {(previewUrl || initialData.imageUrl) && (
              <div className="mb-4 bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl p-2 flex justify-center">
                <img 
                  src={previewUrl || initialData.imageUrl!} 
                  alt="Thumbnail Preview" 
                  className="object-contain w-auto max-h-[250px] mx-auto rounded-lg shadow-sm" 
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer bg-[#F4EFEA] border-2 border-dashed border-[#E8E0D5] hover:border-[#9D4B36] rounded-xl px-4 py-6 text-center transition-colors">
                <span className="material-symbols-outlined text-3xl text-[#7A7067] mb-2 block">add_photo_alternate</span>
                <span className="text-[#1F1C18] font-semibold block text-sm">
                  {image ? image.name : "Klik untuk unggah gambar baru (Opsional)"}
                </span>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Judul Karya</label>
            <input 
              required
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Kategori</label>
            <input 
              type="text" 
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Deskripsi Singkat</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-[#E8E0D5]">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1F1C18] hover:bg-[#36312a] text-white font-bold uppercase tracking-wider text-sm py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Perbarui Portofolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
