"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_CONFIG } from "@/lib/constants";
import { BillData, ApiResponse } from "@/lib/types";
import PostalCodeInput from "./PostalCodeInput";
import { AnalyticsEvents } from "@/lib/analytics";

interface UploadCardProps {
  onUploadSuccess: (data: BillData) => void;
  onUploadError?: (error: string) => void;
}

export default function UploadCard({ onUploadSuccess, onUploadError }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [priceArea, setPriceArea] = useState<string | null>(null);
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
      
      // Lägg till postnummer och prisområde om de finns
      if (postalCode) {
        formData.append("postalCode", postalCode);
      }
      if (priceArea) {
        formData.append("priceArea", priceArea);
      }

      const response = await fetch("/api/parse-bill-v3", {
        method: "POST",
        body: formData
      });

      const result = await response.json() as ApiResponse<BillData>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Kunde inte analysera fakturan");
      }

      // Lägg till postnummer och prisområde i resultatet
      const enhancedData = {
        ...result.data,
        postalCode: postalCode || undefined,
        priceArea: priceArea || undefined
      };

      // Track successful bill upload
      AnalyticsEvents.billUploaded(true);
      
      onUploadSuccess(enhancedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Något gick fel";
      setError(errorMessage);
      
      // Track failed bill upload
      AnalyticsEvents.billUploaded(false);
      AnalyticsEvents.errorOccurred('bill_upload_failed');
      
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
                  JPEG, PNG eller WebP • Max {APP_CONFIG.maxFileSize / 1024 / 1024}MB
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

        {/* Postnummer Input */}
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <PostalCodeInput
              value={postalCode}
              onChange={(code, area) => {
                setPostalCode(code);
                setPriceArea(area);
              }}
              className="mb-4"
            />
            {postalCode.length > 0 && !priceArea && (
              <p className="text-xs text-red-600 mb-2">
                * Ange ett giltigt postnummer för att fortsätta
              </p>
            )}
            <div className="text-xs text-gray-500">
              💡 <strong>Varför behöver vi ditt postnummer?</strong><br />
              Rörliga elpriser varierar beroende på var du bor i Sverige. 
              Vi behöver ditt postnummer för att visa dig de korrekta priserna för ditt område.
            </div>
          </motion.div>
        )}

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
            disabled={isUploading || !priceArea}
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
            ) : !priceArea ? (
              <>
                Ange postnummer först
              </>
            ) : (
              <>
                Kom igång
              </>
            )}
          </motion.button>
        )}

        {/* Info Text */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted text-center">
            🔒 Din faktura analyseras säkert och används för att förbättra vår AI.
            Personuppgifter anonymiseras.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

