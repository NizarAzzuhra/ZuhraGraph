"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminArtworkUploadForm({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    
    try {
      const formPayload = new FormData();
      formPayload.append("file", file);

      const res = await fetch(`/api/admin/orders/${orderId}/artwork`, {
        method: "POST",
        body: formPayload,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Gagal mengunggah file artwork");
        return;
      }

      alert("Artwork berhasil diunggah!");
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem saat mengunggah.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!["PROCESSING", "PROCESSING_REVISION", "WAITING_BUYER_CONFIRMATION", "REVISION_REQUESTED"].includes(currentStatus)) {
    return (
      <div className="bg-[#F5F1EA] border border-[#DDD7CE] rounded p-4 text-center mb-8">
        <p className="text-sm text-[var(--color-secondary)]">
          Artwork upload is available when order is PROCESSING or REVISION.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div 
        className="border-2 border-dashed border-[#DDD7CE] rounded bg-white p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors mb-4 relative"
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file"
          required
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {previewUrl ? (
          <div className="flex flex-col items-center">
            <img src={previewUrl} alt="Preview" className="max-h-48 object-contain mb-2 rounded" />
            <div className="text-sm font-semibold text-[var(--color-primary)] uppercase">{file?.name}</div>
          </div>
        ) : file ? (
          <div className="flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-secondary)] text-4xl mb-4">draft</span>
            <div className="text-sm font-semibold text-[var(--color-primary)] uppercase">{file.name}</div>
            <div className="text-xs text-[var(--color-secondary)] mt-1">Ready to upload</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[var(--color-secondary)] text-4xl mb-4">cloud_upload</span>
            <div className="text-sm font-semibold text-[var(--color-primary)] uppercase mb-2">Drag & Drop Files Here</div>
            <div className="text-xs text-[var(--color-secondary)]">or click to browse from device</div>
            <div className="text-xs text-gray-400 mt-4">Supported: PDF, TIFF, JPG (Max 500MB)</div>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !file}
        className="w-full px-6 py-3 bg-[var(--color-primary)] text-white text-sm font-semibold uppercase rounded hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {isLoading ? "Uploading..." : "Upload File"}
      </button>
    </form>
  );
}
