import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Maximize2,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface KycDocumentUploaderProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
  maxSizeBytes?: number; // default 5MB
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf"
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export default function KycDocumentUploader({ 
  value, 
  onChange, 
  disabled,
  maxSizeBytes = 5 * 1024 * 1024 // 5 Mo
}: KycDocumentUploaderProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; isPdf?: boolean; rawBytes?: number } | null>(() => {
    if (value) {
      const isPdf = value.startsWith("data:application/pdf");
      return {
        name: isPdf ? "Document_Identite.pdf" : "Photo_Identite.jpg",
        size: isPdf ? "Document PDF" : "Image compressée",
        isPdf
      };
    }
    return null;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file size nicely
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  // Convert File to Compressed Data URL with strict client-side validation
  const processFile = (file: File) => {
    setErrorMsg(null);

    // 1. Client-side File Size Validation
    if (file.size > maxSizeBytes) {
      const formattedActual = formatFileSize(file.size);
      const formattedMax = formatFileSize(maxSizeBytes);
      setErrorMsg(`Fichier trop volumineux (${formattedActual}). La taille maximale autorisée est de ${formattedMax}.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg("Le fichier sélectionné est vide (0 Ko). Veuillez choisir un fichier valide.");
      return;
    }

    // 2. Client-side File Type & Extension Validation
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) || file.type.startsWith("image/");

    if (!hasValidExt && !hasValidMime) {
      setErrorMsg("Format de fichier non pris en charge. Veuillez sélectionner une photo (JPG, PNG, WEBP) ou un document PDF.");
      return;
    }

    const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");

    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      isPdf,
      rawBytes: file.size
    });

    setIsProcessing(true);

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        setIsProcessing(false);
        if (typeof reader.result === "string") {
          onChange(reader.result);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setErrorMsg("Impossible de lire ce fichier PDF. Veuillez réessayer.");
      };
      reader.readAsDataURL(file);
      return;
    }

    // Image compression via Canvas to optimize Base64 string payload size
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        img.src = e.target.result;
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      setErrorMsg("Erreur lors de la lecture de l'image. Fichier potentiellement corrompu.");
    };

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          onChange(compressedDataUrl);
        } else {
          onChange(img.src);
        }
      } catch (cErr) {
        onChange(img.src);
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      setIsProcessing(false);
      setErrorMsg("Le fichier sélectionné ne semble pas être une image valide.");
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setFileInfo(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-2.5 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase block font-mono tracking-wider">
          PIÈCE D'IDENTITÉ / JUSTIFICATIF <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-medium">
          Max 5 Mo • JPG, PNG, PDF
        </span>
      </div>

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        /* Instant Image / Document Preview Card */
        <div className="bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5 min-w-0">
              {fileInfo?.isPdf ? (
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 shadow-xs">
                  <FileText className="w-7 h-7" />
                </div>
              ) : (
                <div 
                  onClick={() => setShowFullPreview(true)}
                  className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-emerald-300 dark:border-emerald-700 bg-slate-100 dark:bg-emerald-900 shadow-inner relative cursor-pointer group/img"
                  title="Cliquer pour agrandir"
                >
                  <img
                    src={value}
                    alt="Aperçu document KYC"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              )}

              <div className="min-w-0 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-950 dark:text-white font-bold text-xs truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{fileInfo?.name || "Document_ID_Validé.jpg"}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-emerald-300 font-mono">
                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    {fileInfo?.size || "Prêt"}
                  </span>
                  <span>• Validé côté client</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {!fileInfo?.isPdf && (
                <button
                  type="button"
                  onClick={() => setShowFullPreview(true)}
                  className="p-2 bg-white dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800 border border-slate-200 dark:border-emerald-700 text-slate-700 dark:text-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
                  title="Aperçu plein écran"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="p-2 bg-white dark:bg-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-800 border border-slate-200 dark:border-emerald-700 text-slate-700 dark:text-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Remplacer le document"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="p-2 bg-white dark:bg-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-900 border border-slate-200 dark:border-rose-800 text-slate-500 hover:text-rose-600 dark:text-rose-300 rounded-xl transition-all shadow-xs cursor-pointer"
                title="Supprimer le document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Native Drag & Drop / Click Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-900/60 scale-[1.01]"
              : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/30 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/60 hover:border-emerald-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="max-w-xs mx-auto space-y-3">
            <div className="flex justify-center space-x-2">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) cameraInputRef.current?.click();
                }}
                className="p-2.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Prendre une photo directement avec la caméra"
              >
                <Camera className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-950 dark:text-white">
                Cliquez ou glissez une photo de votre pièce d'identité
              </p>
              <p className="text-[10px] text-slate-500 dark:text-emerald-300 leading-snug">
                Formats autorisés : <span className="font-semibold text-emerald-800 dark:text-emerald-200">PNG, JPG, WEBP, PDF</span> (Max 5 Mo).
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) fileInputRef.current?.click();
                }}
                disabled={disabled}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all cursor-pointer"
              >
                {isProcessing ? "Traitement..." : "Parcourir les fichiers"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled) cameraInputRef.current?.click();
                }}
                disabled={disabled}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-[11px] font-extrabold shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Erreur de validation :</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {showFullPreview && value && !fileInfo?.isPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800 pb-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Aperçu du document d'identité</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-emerald-900 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 dark:border-emerald-800 bg-slate-950 flex items-center justify-center p-2">
              <img
                src={value}
                alt="Document plein écran"
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowFullPreview(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
