import React, { useState, useRef } from "react";
import { Upload, Camera, Image as ImageIcon, Trash2, Star, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ProductImageUploader({
  images,
  onChange,
  maxImages = 10
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  // Helper function to compress and optimize image to WebP/JPEG Data URI
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Max dimension 1200px
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with 0.82 quality for small footprint & crisp detail
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const filesArray = Array.from(fileList);

    if (filesArray.length === 0) return;

    if (images.length + filesArray.length > maxImages) {
      setErrorMessage(`Vous ne pouvez pas ajouter plus de ${maxImages} photos par article.`);
      return;
    }

    // Validate files
    for (const file of filesArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMessage(`Format non supporté: "${file.name}". Utilisez uniquement JPG, JPEG, PNG ou WEBP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`Fichier trop volumineux: "${file.name}". La taille maximale est de 10 Mo par photo.`);
        return;
      }
    }

    setIsProcessing(true);
    setUploadProgress(10);

    try {
      const newCompressedImages: string[] = [];
      const step = Math.round(80 / filesArray.length);

      for (let i = 0; i < filesArray.length; i++) {
        const compressed = await compressImage(filesArray[i]);
        newCompressedImages.push(compressed);
        setUploadProgress((prev) => Math.min(95, prev + step));
      }

      onChange([...images, ...newCompressedImages]);
      setUploadProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setUploadProgress(0);
      }, 400);
    } catch (err) {
      console.error("Error processing product images:", err);
      setErrorMessage("Erreur lors de l'optimisation de l'image. Veuillez réessayer.");
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newArr = [...images];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    onChange(newArr);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider font-mono block">
          Photos de l'Article ({images.length}/{maxImages}) :
        </label>
        <span className="text-[10px] text-emerald-600 font-medium">
          Format JPG, PNG, WEBP (Max 10Mo/photo)
        </span>
      </div>

      {/* Hidden inputs for File Gallery and Camera */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Main Drag & Drop Zone */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-emerald-500 bg-emerald-100/60 scale-[1.01]"
              : "border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/80"
          }`}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200 shadow-sm">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <ImageIcon className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-950">
                Glissez-déposez vos photos ici, ou utilisez l'une des options :
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                Optimisation et compression automatique pour un affichage ultra-rapide
              </p>
            </div>

            {/* Upload Buttons */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Parcourir l'appareil</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => cameraInputRef.current?.click()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Prendre une photo (Caméra)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress Bar Indicator */}
      {isProcessing && (
        <div className="space-y-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
          <div className="flex justify-between text-[10px] font-mono font-bold text-emerald-800">
            <span>Compression & Optimisation des photos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Uploaded Images Gallery & Grid Preview */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold text-emerald-700 uppercase font-mono block">
            Aperçu des Photos ({images.length}) - La première photo sera la photo de couverture principale :
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((imgUrl, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={`img-${index}`}
                  className={`relative group bg-white rounded-2xl border overflow-hidden transition-all shadow-sm ${
                    isPrimary ? "border-amber-400 ring-2 ring-amber-400/30" : "border-slate-200"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Product photo ${index + 1}`}
                    className="w-full h-28 object-cover"
                  />

                  {/* Primary Cover Badge */}
                  {isPrimary ? (
                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow flex items-center space-x-1 font-mono">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Couverture</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      className="absolute top-1.5 left-1.5 bg-slate-900/80 hover:bg-amber-500 text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-mono"
                    >
                      Mettre en couverture
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Reorder Arrows */}
                  <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/70 p-1 rounded-lg text-white">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "left")}
                      className="p-0.5 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                      title="Déplacer à gauche"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono font-bold">{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => handleMove(index, "right")}
                      className="p-0.5 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                      title="Déplacer à droite"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
