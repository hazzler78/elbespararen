"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, User, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_CONFIG } from "@/lib/constants";
import { BillData, ApiResponse } from "@/lib/types";
import PostalCodeInput from "./PostalCodeInput";
import { AnalyticsEvents } from "@/lib/analytics";
import { isValidSwedishPostalCode } from "@/lib/price-areas";

interface UploadCardProps {
  onUploadSuccess: (data: BillData) => void;
  onUploadError?: (error: string) => void;
}

export default function UploadCard({ onUploadSuccess, onUploadError }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BillData | null>(null);
  const [userChoiceMade, setUserChoiceMade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [priceArea, setPriceArea] = useState<string | null>(null);
  const [detectedArea, setDetectedArea] = useState<string | null>(null);
  const [lastSavedPostalCode, setLastSavedPostalCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout när komponenten unmountas
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Rensa state när komponenten mountas för att undvika att visa gammal data
  useEffect(() => {
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setUserChoiceMade(false);
    setError(null);
    setIsUploading(false);
    setFile(null);
    setPreview(null);
  }, []);

  // Funktion för att spara postal code analytics med debounce
  const savePostalCodeAnalytics = useCallback(async (
    postalCode: string,
    detectedArea: string | null,
    selectedArea: string,
    wasManuallyChanged: boolean
  ) => {
    // Förhindra att samma postnummer sparas flera gånger
    if (lastSavedPostalCode === postalCode) {
      return;
    }

    try {
      console.log('[UploadCard] Saving postal code analytics:', { postalCode, detectedArea, selectedArea, wasManuallyChanged });
      const response = await fetch('/api/postal-code-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postalCode,
          detectedArea: detectedArea || undefined,
          selectedArea,
          wasManuallyChanged,
          pageContext: 'upload'
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        console.error('[UploadCard] Failed to save analytics:', result);
      } else {
        console.log('[UploadCard] Analytics saved successfully:', result);
        setLastSavedPostalCode(postalCode);
      }
    } catch (error) {
      // Tyst fel - analytics ska inte påverka användarupplevelsen
      console.error('[UploadCard] Failed to save postal code analytics:', error);
    }
  }, [lastSavedPostalCode]);

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
        body: formData,
        credentials: 'include' // Include cookies for authentication
      });

      const result = await response.json() as ApiResponse<BillData> & {
        meta?: {
          dbSaved?: boolean;
          dbError?: string;
        };
      };

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Kunde inte analysera fakturan");
      }

      // Varna om analysen inte sparades i databasen
      if (result.meta?.dbSaved === false) {
        console.warn("[UploadCard] ⚠️ Analysen kunde inte sparas i databasen för admin-granskning");
        console.warn("[UploadCard] Fel:", result.meta.dbError);
        console.warn("[UploadCard] Detta kan bero på att tabellen saknas eller databas-binding saknas");
      } else if (result.meta?.dbSaved === true) {
        console.log("[UploadCard] ✅ Analys sparad i databasen för admin-granskning");
      }

      // Lägg till postnummer och prisområde i resultatet
      const enhancedData = {
        ...result.data,
        postalCode: postalCode || undefined,
        priceArea: priceArea || undefined
      };

      // Track successful bill upload
      AnalyticsEvents.billUploaded(true);
      
      // Spara resultatet och vänta på användarens val
      setAnalysisResult(enhancedData);
      setIsAnalysisComplete(true);
      setIsUploading(false); // Analysen är klar, men vi väntar på användarens val
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Något gick fel";
      setError(errorMessage);
      
      // Track failed bill upload
      AnalyticsEvents.billUploaded(false);
      AnalyticsEvents.errorOccurred('bill_upload_failed');
      
      onUploadError?.(errorMessage);
      setIsUploading(false);
    }
  };

  const handleUserChoice = (choice: 'register' | 'premium' | 'skip') => {
    if (userChoiceMade) {
      console.log('[UploadCard] handleUserChoice: Användaren har redan gjort ett val');
      return; // Förhindra dubbelklick
    }
    
    console.log('[UploadCard] handleUserChoice:', choice, 'analysisResult:', !!analysisResult);
    
    setUserChoiceMade(true);
    
    // Om användaren väljer att skapa konto eller bli premium, redirecta
    if (choice === 'register') {
      console.log('[UploadCard] Användaren valde att skapa konto');
      // Spara analysresultatet i localStorage så det finns kvar efter OAuth-redirect
      // localStorage överlever OAuth-redirects bättre än sessionStorage
      if (analysisResult && typeof window !== "undefined") {
        console.log('[UploadCard] Sparar analysisResult i localStorage:', {
          totalAmount: analysisResult.totalAmount,
          confidence: analysisResult.confidence,
          postalCode: analysisResult.postalCode
        });
        localStorage.setItem("pendingBillData", JSON.stringify(analysisResult));
        sessionStorage.setItem("pendingAnalysis", "true");
        console.log('[UploadCard] ✅ billData sparad i localStorage, pendingAnalysis i sessionStorage');
        
        // Verifiera att det sparades korrekt
        const savedBillData = localStorage.getItem("pendingBillData");
        const savedPending = sessionStorage.getItem("pendingAnalysis");
        console.log('[UploadCard] Verifiering - pendingBillData sparad:', !!savedBillData);
        console.log('[UploadCard] Verifiering - pendingAnalysis:', savedPending);
      } else {
        console.error('[UploadCard] ❌ analysisResult saknas eller window är undefined!');
        console.error('[UploadCard] analysisResult:', analysisResult);
        console.error('[UploadCard] window:', typeof window);
      }
      // Redirect till register med callbackUrl tillbaka till upload och pendingAnalysis flag
      // Vi lägger till pendingAnalysis=1 i URL:en också som backup om sessionStorage försvinner
      const redirectUrl = `/auth/register?callbackUrl=${encodeURIComponent('/upload?pendingAnalysis=1')}`;
      console.log('[UploadCard] Redirectar till:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
    
    if (choice === 'premium') {
      // Spara analysresultatet i localStorage så det finns kvar efter OAuth-redirect
      if (analysisResult && typeof window !== "undefined") {
        localStorage.setItem("pendingBillData", JSON.stringify(analysisResult));
        sessionStorage.setItem("pendingAnalysis", "true");
      }
      // Redirect till premium med callbackUrl tillbaka till upload och pendingAnalysis flag
      window.location.href = `/premium?callbackUrl=${encodeURIComponent('/upload?pendingAnalysis=1')}`;
      return;
    }
    
    // Om användaren väljer att hoppa över, visa resultatet direkt
    if (choice === 'skip') {
      console.log('[UploadCard] Användaren valde att hoppa över registrering');
      if (analysisResult) {
        console.log('[UploadCard] Anropar onUploadSuccess med analysisResult');
        onUploadSuccess(analysisResult);
      } else {
        console.error('[UploadCard] ❌ analysisResult saknas när användaren valde att hoppa över!');
        console.error('[UploadCard] isAnalysisComplete:', isAnalysisComplete);
        console.error('[UploadCard] isUploading:', isUploading);
        // Om analysisResult saknas av någon anledning, visa felmeddelande
        setError("Kunde inte hitta analysresultatet. Vänligen försök igen.");
      }
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
              onChange={(code, area, wasManuallyChanged, detected) => {
                setPostalCode(code);
                setPriceArea(area);
                if (detected) {
                  setDetectedArea(detected);
                }
                // Rensa tidigare timeout
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current);
                }
                // Spara analytics när både postnummer och område är valt (med debounce)
                if (code && area && isValidSwedishPostalCode(code)) {
                  saveTimeoutRef.current = setTimeout(() => {
                    savePostalCodeAnalytics(
                      code,
                      detected || null,
                      area,
                      wasManuallyChanged || false
                    );
                  }, 1000); // Vänta 1 sekund efter senaste ändringen
                }
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

        {/* Registration Options - Shown during and after analysis until user makes a choice */}
        <AnimatePresence>
          {(isUploading || (isAnalysisComplete && !userChoiceMade)) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-border"
            >
              <p className="text-sm font-medium text-gray-900 mb-4 text-center">
                {isUploading ? (
                  "Medan vi analyserar din faktura..."
                ) : (
                  "Välj ett alternativ för att fortsätta:"
                )}
              </p>
              <div className="space-y-3">
                {/* Skapa konto */}
                <button
                  onClick={() => handleUserChoice('register')}
                  disabled={userChoiceMade}
                  className="
                    flex items-center justify-between gap-3
                    w-full p-4 bg-primary text-white rounded-lg
                    hover:bg-primary/90 transition-colors
                    font-medium
                    group
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Skapa konto</div>
                      <div className="text-xs text-white/80">Spara din faktura - helt gratis</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Bli premium */}
                <button
                  onClick={() => handleUserChoice('premium')}
                  disabled={userChoiceMade}
                  className="
                    flex items-center justify-between gap-3
                    w-full p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-lg
                    hover:from-yellow-500 hover:to-yellow-600 transition-colors
                    font-medium
                    group
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-900/20 rounded-lg">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Bli Premium</div>
                      <div className="text-xs text-yellow-900/80">Alla fördelar och obegränsad historik</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Hoppa över */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[UploadCard] "Hoppa över" knapp klickad');
                    handleUserChoice('skip');
                  }}
                  disabled={userChoiceMade || !analysisResult}
                  className="
                    w-full py-2 text-sm text-gray-400 hover:text-gray-500
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  type="button"
                >
                  Hoppa över registrering
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

