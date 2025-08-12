import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: any) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simplified file upload component for logo uploads
 * This is a basic implementation without Uppy dependencies
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxFileSize) {
        alert(`Dosya boyutu ${Math.round(maxFileSize / 1024 / 1024)}MB'den küçük olmalıdır.`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Get upload parameters
      const { method, url } = await onGetUploadParameters();
      
      // Upload file
      const response = await fetch(url, {
        method,
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (response.ok) {
        // Simulate successful upload result
        const mockResult = {
          successful: [{
            uploadURL: url.split('?')[0], // Remove query params for clean URL
            name: selectedFile.name,
            size: selectedFile.size,
          }]
        };
        
        onComplete?.(mockResult);
        setSelectedFile(null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Yükleme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-2">
      {!selectedFile ? (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              className={buttonClassName}
              disabled={isUploading}
              asChild
            >
              <span className="cursor-pointer">
                {children}
              </span>
            </Button>
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-600">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-white">{selectedFile.name}</span>
              <span className="text-xs text-slate-400">
                ({Math.round(selectedFile.size / 1024)}KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full admin-button"
          >
            {isUploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </div>
      )}
    </div>
  );
}