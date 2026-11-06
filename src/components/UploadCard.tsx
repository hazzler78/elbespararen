"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileImage, Loader2, CheckCircle2, AlertCircle, User, Sparkles, ArrowRight, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { APP_CONFIG } from "@/lib/constants";
import { BillData, ApiResponse } from "@/lib/types";
import PostalCodeInput from "./PostalCodeInput";
import { AnalyticsEvents } from "@/lib/analytics";
import { isValidSwedishPostalCode } from "@/lib/price-areas";
import { messageForAnalysisFailure } from "@/lib/upload-analysis-error";

interface UploadCardProps {
  onUploadSuccess: (data: BillData) => void;
  onUploadError?: (error: string) => void;
  isUserLoggedIn?: boolean; // Om användaren redan är inloggad, hoppa över registreringsalternativen
}

type PagePreview = { file: File; preview: string };

export default function UploadCard({ onUploadSuccess, onUploadError, isUserLoggedIn = false }: UploadCardProps) {
  const [pages, setPages] = useState<PagePreview[]>([]);
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
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const continuationRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Cleanup timeout när komponenten unmountas
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAnalysisComplete || userChoiceMade) return;
    continuationRef.current?.scrollIntoView({ block: "start" });
  }, [isAnalysisComplete, userChoiceMade]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

  // Rensa state när komponenten mountas för att undvika att visa gammal data
  useEffect(() => {
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setUserChoiceMade(false);
    setError(null);
    setIsUploading(false);
    setPages([]);
  }, []);

  const readPreview = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Kunde inte läsa bilden"));
      reader.readAsDataURL(file);
    });

  const addFiles = async (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    if (list.length === 0) return;

    const remaining = APP_CONFIG.maxBillPages - pages.length;
    if (remaining <= 0) {
      setError(`Max ${APP_CONFIG.maxBillPages} sidor per analys`);
      return;
    }

    const accepted: File[] = [];
    for (const file of list.slice(0, remaining)) {
      if (!APP_CONFIG.acceptedFileTypes.includes(file.type)) {
        setError("Endast JPEG, PNG och WebP tillåts. PDF stöds inte — fotografera varje sida.");
        continue;
      }
      if (file.size > APP_CONFIG.maxFileSize) {
        setError(`Filen ${file.name} är för stor. Max ${APP_CONFIG.maxFileSize / 1024 / 1024}MB per sida.`);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;

    try {
      const next = await Promise.all(
        accepted.map(async (file) => ({
          file,
          preview: await readPreview(file),
        }))
      );
      setPages((prev) => [...prev, ...next].slice(0, APP_CONFIG.maxBillPages));
      setError(null);
    } catch {
      setError("Kunde inte läsa en eller flera bilder");
    }
  };

  const removePage = (index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      void addFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      void addFiles(e.target.files);
    }
    // Allow selecting the same file again after remove
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (pages.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const page of pages) {
        formData.append("file", page.file);
      }
      
      // Lägg till postnummer och prisområde om de finns
      if (postalCode) {
        formData.append("postalCode", postalCode);
      }
      if (priceArea) {
        formData.append("priceArea", priceArea);
      }

      let response: Response;
      try {
        response = await fetch("/api/parse-bill-v3", {
          method: "POST",
          body: formData,
          credentials: 'include' // Include cookies for authentication
        });
      } catch {
        throw new Error(
          messageForAnalysisFailure({ network: true })
        );
      }

      const rawBody = await response.text();
      let result: ApiResponse<BillData> & {
        details?: string;
        meta?: {
          dbSaved?: boolean;
          dbError?: string;
          accountSaved?: boolean;
          accountSaveBlocked?: boolean;
          accountSaveLimit?: number;
        };
      };
      try {
        result = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        throw new Error(
          messageForAnalysisFailure({ status: response.status, parseFailed: true })
        );
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          messageForAnalysisFailure({
            status: response.status,
            error: typeof result.error === "string" ? result.error : undefined,
            details: typeof result.details === "string" ? result.details : undefined,
          })
        );
      }

      // Varna om analysen inte sparades i databasen
      if (result.meta?.dbSaved === false) {
        console.warn("[UploadCard] ⚠️ Analysen kunde inte sparas i databasen för admin-granskning");
        console.warn("[UploadCard] Fel:", result.meta.dbError);
        console.warn("[UploadCard] Detta kan bero på att tabellen saknas eller databas-binding saknas");
      } else if (result.meta?.dbSaved === true) {
        console.log("[UploadCard] ✅ Analys sparad i databasen för admin-granskning");
      }

      if (typeof window !== "undefined" && result.meta?.accountSaveBlocked) {
        sessionStorage.setItem(
          "accountSaveBlocked",
          JSON.stringify({
            limit: result.meta.accountSaveLimit ?? 2,
            at: Date.now(),
          })
        );
      } else if (typeof window !== "undefined") {
        sessionStorage.removeItem("accountSaveBlocked");
      }

      // Lägg till postnummer och prisområde i resultatet
      const enhancedData = {
        ...result.data,
        postalCode: postalCode || undefined,
        priceArea: priceArea || undefined
      };

      // Track successful bill upload
      AnalyticsEvents.billUploaded(true);
      
      setAnalysisResult(enhancedData);
      setIsAnalysisComplete(true);
      setIsUploading(false);

      // Inloggad användare har redan fått fakturan sparad — gå direkt till resultatet.
      if (isUserLoggedIn) {
        console.log('[UploadCard] Användaren är redan inloggad, fakturan är redan sparad. Går direkt till resultat.');
        onUploadSuccess(enhancedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : messageForAnalysisFailure({});
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
      // Spara analysresultatet i cookie så det finns kvar efter OAuth-redirect
      // Cookies överlever OAuth-redirects bättre än localStorage/sessionStorage
      if (analysisResult && typeof window !== "undefined") {
        console.log('[UploadCard] Sparar analysisResult i cookie:', {
          totalAmount: analysisResult.totalAmount,
          confidence: analysisResult.confidence,
          postalCode: analysisResult.postalCode
        });
        
        // Spara i cookie (giltig i 1 timme, säkert för OAuth-redirects)
        const cookieValue = encodeURIComponent(JSON.stringify(analysisResult));
        document.cookie = `pendingBillData=${cookieValue}; path=/; max-age=3600; SameSite=Lax`;
        
        // Spara också i localStorage och sessionStorage som backup
        localStorage.setItem("pendingBillData", JSON.stringify(analysisResult));
        sessionStorage.setItem("pendingAnalysis", "true");
        
        console.log('[UploadCard] ✅ billData sparad i cookie, localStorage och sessionStorage');
        
        // Verifiera att det sparades korrekt
        const savedBillData = localStorage.getItem("pendingBillData");
        const savedPending = sessionStorage.getItem("pendingAnalysis");
        const cookieExists = document.cookie.includes("pendingBillData");
        console.log('[UploadCard] Verifiering - pendingBillData i cookie:', cookieExists);
        console.log('[UploadCard] Verifiering - pendingBillData i localStorage:', !!savedBillData);
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
      // Spara analysresultatet i cookie så det finns kvar efter OAuth-redirect
      if (analysisResult && typeof window !== "undefined") {
        const cookieValue = encodeURIComponent(JSON.stringify(analysisResult));
        document.cookie = `pendingBillData=${cookieValue}; path=/; max-age=3600; SameSite=Lax`;
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
          onClick={() => {
            if (pages.length === 0) fileInputRef.current?.click();
          }}
          className={`
            border-2 border-dashed rounded-lg text-center
            transition-colors duration-200
            ${isAnalysisComplete ? "p-4" : "p-8 sm:p-12"}
            ${pages.length > 0 ? "border-success bg-success/5 cursor-default" : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={APP_CONFIG.acceptedFileTypes.join(",")}
            multiple
            onChange={handleChange}
            className="hidden"
          />
          <input
            ref={addMoreInputRef}
            type="file"
            accept={APP_CONFIG.acceptedFileTypes.join(",")}
            multiple
            onChange={handleChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {pages.length === 0 ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted" />
                <h3 className="text-lg font-semibold mb-2">Ladda upp din elräkning</h3>
                <p className="text-muted text-sm mb-4">
                  Dra och släpp eller klicka för att välja bilder
                </p>
                <p className="text-xs text-muted">
                  1–{APP_CONFIG.maxBillPages} sidor • JPEG, PNG eller WebP • Max{" "}
                  {APP_CONFIG.maxFileSize / 1024 / 1024}MB per sida
                </p>
                <p className="text-xs text-muted mt-2">
                  Har du elnät och elhandel på olika sidor? Ladda upp båda.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="font-medium">
                    {pages.length === 1 ? "1 sida vald" : `${pages.length} sidor valda`}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {pages.map((page, index) => (
                    <div
                      key={`${page.file.name}-${page.file.size}-${index}`}
                      className="relative rounded-lg border border-border bg-white p-2 text-left"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(index);
                        }}
                        className="absolute -top-2 -right-2 z-10 rounded-full bg-white border border-border p-1 shadow-sm hover:bg-gray-50"
                        aria-label={`Ta bort sida ${index + 1}`}
                      >
                        <X className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      {page.preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.preview}
                          alt={`Sida ${index + 1}`}
                          className={`${isAnalysisComplete ? "h-16" : "h-28"} w-full object-contain rounded mb-2`}
                        />
                      ) : (
                        <FileImage className="w-10 h-10 mx-auto my-6 text-success" />
                      )}
                      <p className="text-xs font-medium truncate">Sida {index + 1}</p>
                      <p className="text-[11px] text-muted truncate">{page.file.name}</p>
                      <p className="text-[11px] text-muted">
                        {(page.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ))}
                </div>
                {pages.length < APP_CONFIG.maxBillPages && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addMoreInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <Plus className="w-4 h-4" />
                    Lägg till sida ({pages.length}/{APP_CONFIG.maxBillPages})
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Postnummer Input */}
        {pages.length > 0 && (
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
            {!isAnalysisComplete && (
              <div className="text-xs text-gray-500">
                💡 <strong>Varför behöver vi ditt postnummer?</strong><br />
                Rörliga elpriser varierar beroende på var du bor i Sverige. 
                Vi behöver ditt postnummer för att visa dig de korrekta priserna för ditt område.
              </div>
            )}
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              ref={errorRef}
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3"
              style={{ scrollMarginTop: "5rem", scrollMarginBottom: "6rem" }}
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
        {pages.length > 0 && !isAnalysisComplete && (
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
                Analyserar {pages.length > 1 ? `${pages.length} sidor` : "faktura"}...
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
              ref={continuationRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-border max-sm:pr-16"
              style={{ scrollMarginTop: "5rem", scrollMarginBottom: "7rem" }}
            >
              <p className="text-sm font-medium text-gray-900 mb-4 text-center">
                {isUploading ? (
                  "Medan vi analyserar din faktura..."
                ) : (
                  "Analysen är klar"
                )}
              </p>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => handleUserChoice('skip')}
                  disabled={userChoiceMade || !analysisResult}
                  className="
                    mb-3 w-full py-4 px-6 bg-primary text-white font-semibold rounded-lg
                    hover:bg-primary/90 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                  "
                >
                  Se resultatet
                </button>
              )}
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
                      <div className="text-xs text-white/80">Spara upp till 2 fakturor gratis</div>
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
                      <div className="font-semibold">Bli Premium — 49 kr/år</div>
                      <div className="text-xs text-yellow-900/80">Obegränsad historik + CSV-export</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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

