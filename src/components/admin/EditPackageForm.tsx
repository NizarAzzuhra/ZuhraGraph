"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  maxActiveSlots: number;
  imageUrl: string | null;
  features: string[];
}

export default function EditPackageForm({ initialData }: { initialData: PackageData }) {
  const [formData, setFormData] = useState({
    name: initialData.name,
    description: initialData.description || "",
    price: initialData.price.toString(),
    maxActiveSlots: initialData.maxActiveSlots.toString(),
  });
  const [features, setFeatures] = useState<string[]>(
    initialData.features && initialData.features.length > 0 
      ? initialData.features 
      : [""]
  );
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

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    if (newFeatures.length === 0) newFeatures.push("");
    setFeatures(newFeatures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("description", formData.description);
      formPayload.append("price", formData.price);
      formPayload.append("maxActiveSlots", formData.maxActiveSlots);
      formPayload.append("features", JSON.stringify(features));
      if (image) {
        formPayload.append("image", image);
      }

      const res = await fetch(`/api/admin/packages/${initialData.id}`, {
        method: "PATCH",
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui paket");
        return;
      }

      router.push("/admin/packages");
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
          <h1 className="text-3xl font-extrabold text-[#1F1C18] mb-2">Edit Paket</h1>
          <p className="text-[#7A7067]">Perbarui informasi paket komisi Anda.</p>
        </div>
        <Link href="/admin/packages" className="text-[#7A7067] hover:text-[#9D4B36] font-semibold text-sm transition-colors">
          Batal & Kembali
        </Link>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E8E0D5] rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Thumbnail Paket</label>
            
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
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Nama Paket</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Deskripsi Layanan</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Yang Anda Dapatkan / Fitur Paket</label>
            <div className="space-y-3 mb-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
                    placeholder="Contoh: 1 Karakter full render"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="flex items-center gap-2 text-[#9D4B36] font-semibold text-sm hover:bg-[#F4EFEA] px-3 py-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Poin Fitur
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Harga (Rp)</label>
              <input 
                required
                type="number" 
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1F1C18] mb-2 uppercase tracking-wider">Maksimal Slot</label>
              <input 
                required
                type="number" 
                min="1"
                value={formData.maxActiveSlots}
                onChange={(e) => setFormData({...formData, maxActiveSlots: e.target.value})}
                className="w-full bg-[#F4EFEA] border border-[#E8E0D5] rounded-xl px-4 py-3 text-[#1F1C18] focus:outline-none focus:border-[#9D4B36] transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E0D5]">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#1F1C18] hover:bg-[#36312a] text-white font-bold uppercase tracking-wider text-sm py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? "Menyimpan..." : "Perbarui Paket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
