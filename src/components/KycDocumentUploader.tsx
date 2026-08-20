import React, { useState, useRef } from "react";
import { UploadCloud, Camera, Image as ImageIcon, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";

interface KycDocumentUploaderProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
}

export default function KycDocumentUploader({ value, onChange, disabled }: KycDocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; isPdf?: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Helper to format file size nicely
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  // Convert File to Compressed Data URL
  const processFile = (file: File) => {
    setErrorMsg(null);

    // Validate size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Le fichier dépasse la taille maximale autorisée de 5 Mo.");
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isImage && !isPdf) {
      setErrorMsg("Format de fichier non pris en charge. Veuillez fournir une image (JPG, PNG, WEBP) ou un fichier PDF.");
      return;
    }

    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      isPdf
    });

    if (isPdf) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onChange(reader.result);
        }
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

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
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
        // Compress as JPEG 0.82 quality
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        onChange(compressedDataUrl);
      } else {
        onChange(img.src);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-2 font-sans">
      <label className="text-[10px] font-extrabold text-emerald-800 uppercase block font-mono tracking-wider">
        PHOTO / SCAN DU DOCUMENT D'IDENTITÉ <span className="text-rose-500">*</span>
      </label>

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
        /* Preview Card */
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm relative overflow-hidden group">
          <div className="flex items-center space-x-3.5 min-w-0">
            {fileInfo?.isPdf ? (
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-200">
                <FileText className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-emerald-200 bg-slate-100 shadow-inner">
                <img
                  src={value}
                  alt="Aperçu document d'identité"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center space-x-1.5 text-emerald-950 font-bold text-xs truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{fileInfo?.name || "Document_ID_Scan.jpg"}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {fileInfo?.size ? `${fileInfo.size} • ` : ""}Format valide et encodé
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            title="Supprimer et réimporter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Native Drag & Drop / Click Zone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? "border-emerald-500 bg-emerald-100/60 scale-[1.01]"
              : "border-emerald-200/90 bg-emerald-50/30 hover:bg-emerald-50/80 hover:border-emerald-400"
          }`}
        >
          <div className="max-w-xs mx-auto space-y-3">
            <div className="flex justify-center space-x-2">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="p-2.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Prendre une photo directement avec la caméra"
              >
                <Camera className="w-6 h-6" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-950">
                Cliquez ou glissez une photo de votre pièce d'identité ici
              </p>
              <p className="text-[10px] text-slate-500 leading-snug">
                Formats acceptés : <span className="font-semibold text-emerald-800">PNG, JPG, WEBP, PDF</span> (Max 5 Mo).
              </p>
            </div>

            <div className="flex justify-center items-center gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-extrabold shadow-sm transition-all"
              >
                Parcourir les fichiers
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-[11px] font-extrabold shadow-sm transition-all flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
