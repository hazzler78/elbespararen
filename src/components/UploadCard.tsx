"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_CONFIG } from "@/lib/constants";
import { BillData } from "@/lib/types";

interface UploadCardProps {
  onUploadSuccess: (data: BillData) => void;
  onUploadError?: (error: string) => void;
}

export default function UploadCard({ onUploadSuccess, onUploadError }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Skapa preview för bilder
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null); // PDF har ingen preview
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-bill-v3", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Kunde inte analysera fakturan");
      }

      onUploadSuccess(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Något gick fel";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-border p-8">
        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${file ? "border-success bg-success/5" : "border-border hover:border-primary hover:bg-primary/5"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={APP_CONFIG.acceptedFileTypes.join(",")}
            onChange={handleChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted" />
                <h3 className="text-lg font-semibold mb-2">Ladda upp din elräkning</h3>
                <p className="text-muted text-sm mb-4">
                  Dra och släpp eller klicka för att välja fil
                </p>
                <p className="text-xs text-muted">
                  JPEG, PNG, WebP eller PDF • Max {APP_CONFIG.maxFileSize / 1024 / 1024}MB
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto mb-4 rounded"
                  />
                ) : (
                  <FileImage className="w-12 h-12 mx-auto mb-4 text-success" />
                )}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="font-medium">{file.name}</p>
                </div>
                <p className="text-xs text-muted">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-error text-sm">Något gick fel</p>
                <p className="text-sm text-error/80">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Button */}
        {file && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleUpload}
            disabled={isUploading}
            className="
              mt-6 w-full py-4 px-6 bg-primary text-white font-semibold rounded-lg
              hover:bg-primary/90 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyserar faktura...
              </>
            ) : (
              <>
                Analysera min faktura
              </>
            )}
          </motion.button>
        )}

        {/* Info Text */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted text-center">
            🔒 Din faktura analyseras säkert och raderas direkt efter analysen.
            Vi sparar aldrig dina personuppgifter.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

