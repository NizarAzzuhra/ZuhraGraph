import React, { useRef, useState } from 'react';

export type ReferenceImage = {
  url: string;
  publicId: string;
  name?: string;
  size?: number;
};

interface Props {
  title: string;
  description: string;
  maxFiles: number;
  images: ReferenceImage[];
  setImages: React.Dispatch<React.SetStateAction<ReferenceImage[]>>;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export function ReferenceUploader({
  title,
  description,
  maxFiles,
  images,
  setImages,
  onUploadStart,
  onUploadEnd,
  onError,
  disabled
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxFiles) {
      onError(`Anda hanya dapat mengunggah maksimal ${maxFiles} gambar untuk ${title}.`);
      return;
    }

    onUploadStart();
    setLocalUploading(true);
    setUploadProgress(10); // Start progress

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (file.size > 10 * 1024 * 1024) {
          onError(`Ukuran file ${file.name} melebihi batas 10 MB.`);
          continue;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          onError(`Format file ${file.name} tidak didukung. Harus berformat JPG, PNG, atau WebP.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        setUploadProgress(50); // Mid progress

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success) {
          setImages(prev => [
            ...prev, 
            { url: data.url, publicId: data.publicId, name: file.name, size: file.size }
          ]);
        } else {
          onError(data.message || `Gagal mengunggah ${file.name}`);
        }
        setUploadProgress(Math.floor(((i + 1) / files.length) * 100));
      }
    } catch (err: any) {
      onError('Terjadi kesalahan saat mengunggah.');
    } finally {
      setLocalUploading(false);
      setUploadProgress(0);
      onUploadEnd();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async (index: number) => {
    if (disabled) return;
    const imageToRemove = images[index];
    
    setImages(prev => prev.filter((_, i) => i !== index));

    try {
      await fetch(`/api/upload?publicId=${encodeURIComponent(imageToRemove.publicId)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to cleanup image', error);
    }
  };

  return (
    <div className="w-full">
      {/* Drag Drop Zone */}
      {images.length < maxFiles && !localUploading && (
        <div 
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors group ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-surface-container-lowest'}`}
        >
          <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>cloud_upload</span>
          </div>
          <p className="text-body-md font-body-md text-on-surface mb-1">
            <span className="font-bold">Klik untuk mengunggah</span> atau seret dan lepas
          </p>
          <p className="text-caption font-caption text-on-surface-variant">JPG, PNG, atau WebP (maks. 10MB)</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg, image/png, image/webp"
            multiple
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* Uploaded Previews */}
      {(images.length > 0 || localUploading) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {images.map((img, idx) => (
            <div key={img.publicId} className={`border border-outline-variant rounded-xl p-3 flex items-center gap-3 bg-surface-container-lowest ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="w-12 h-12 rounded bg-surface-container overflow-hidden flex-shrink-0">
                <img src={img.url} alt="reference" className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-label-md font-label-md text-on-surface truncate">{img.name || 'Image'}</p>
                {img.size && (
                  <p className="text-caption font-caption text-on-surface-variant">{formatSize(img.size)}</p>
                )}
              </div>
              {!disabled && (
                <button 
                  type="button"
                  onClick={() => handleRemove(idx)}
                  aria-label="Remove" 
                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
                </button>
              )}
            </div>
          ))}

          {/* Uploading State */}
          {localUploading && (
            <div className="border border-outline-variant rounded-xl p-3 flex items-center gap-3 bg-surface-container-lowest relative overflow-hidden">
              <div 
                className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin" style={{ fontVariationSettings: "'FILL' 0" }}>progress_activity</span>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-label-md font-label-md text-on-surface truncate">Mengunggah file...</p>
                <p className="text-caption font-caption text-primary">Uploading... {uploadProgress}%</p>
              </div>
              <button type="button" aria-label="Cancel" className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-not-allowed opacity-50">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
