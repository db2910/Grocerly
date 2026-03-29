"use client";

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUploadStart?: () => void;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export default function ImageUpload({
  currentImageUrl,
  onUploadStart,
  onUploadComplete,
  onUploadError
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    onUploadStart?.();

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      onUploadComplete(publicUrlData.publicUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error('Failed to upload image', { description: error.message });
      onUploadError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:border-primary/50'
        }`}
      >
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <span className="text-sm font-bold text-slate-500">Uploading image...</span>
          </div>
        ) : currentImageUrl ? (
          <div className="absolute inset-0 w-full h-full group">
            <img src={currentImageUrl} alt="Uploaded preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white">
              <span className="material-symbols-outlined text-3xl mb-1">cloud_upload</span>
              <span className="text-sm font-bold">Replace Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-1">add_photo_alternate</span>
            <p className="text-sm font-bold">Click or drag image here</p>
            <p className="text-xs">JPEG, PNG or WebP (max 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
