import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, QrCode, Phone, ShieldCheck, Sparkles, Smartphone } from "lucide-react";

interface TMoneyPaymentCardProps {
  amount: number;
  method?: "TMoney" | "Flooz" | string;
  formatCurrency?: (val: number) => string;
  onSuccess?: () => void;
}

export default function TMoneyPaymentCard({
  amount,
  method = "TMoney",
  formatCurrency = (v) => `${v.toLocaleString("fr-FR")} FCFA`,
  onSuccess
}: TMoneyPaymentCardProps) {
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [qrFormat, setQrFormat] = useState<"ussd" | "merchant">("ussd");
  const qrRef = useRef<HTMLDivElement>(null);

  const isFlooz = method === "Flooz";
  const merchantCode = "1355124";
  const merchantName = "Lgf's Shop";

  // Official Togo Mobile Money USSD strings
  // TMoney (Togocom): *145*5*MONTANT*1355124#
  // Flooz (Moov Africa): *155*4*1*1355124*MONTANT#
  const cleanAmount = Math.max(1, Math.round(amount));
  const ussdCode = isFlooz
    ? `*155*4*1*${merchantCode}*${cleanAmount}#`
    : `*145*5*${cleanAmount}*${merchantCode}#`;

  // Payload encoded in the QR Code
  const qrPayload = qrFormat === "ussd" ? ussdCode : merchantCode;

  const handleCopyUssd = () => {
    navigator.clipboard.writeText(ussdCode);
    setCopiedUssd(true);
    setTimeout(() => setCopiedUssd(false), 2000);
  };

  const handleCopyMerchant = () => {
    navigator.clipboard.writeText(merchantCode);
    setCopiedMerchant(true);
    setTimeout(() => setCopiedMerchant(false), 2000);
  };

  const handleDownloadQr = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // High resolution canvas for sharp printing/scanning
      canvas.width = 800;
      canvas.height = 800;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 700, 700);
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Code_${method}_${merchantCode}_LGF.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };

      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error("Failed to download QR code", e);
    }
  };

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isFlooz
        ? "bg-gradient-to-b from-orange-50/90 via-white to-amber-50/50 border-orange-200"
        : "bg-gradient-to-b from-amber-50/90 via-white to-yellow-50/50 border-amber-200"
    }`}>
      {/* Header Banner */}
      <div className={`px-4 py-3 flex items-center justify-between text-white font-medium ${
        isFlooz
          ? "bg-gradient-to-r from-orange-600 to-amber-600"
          : "bg-gradient-to-r from-amber-600 via-yellow-600 to-yellow-700"
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wide uppercase font-mono">
              Paiement Marchand {method}
            </h4>
            <p className="text-[10px] text-white/90 font-medium">
              Scannez ou composez le code USSD
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold font-mono tracking-wider">
          Togo (+228)
        </span>
      </div>

      <div className="p-4 space-y-4 text-center">
        {/* Toggle QR Code payload mode */}
        <div className="flex justify-center items-center space-x-1.5 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setQrFormat("ussd")}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              qrFormat === "ussd"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Code USSD Complet
          </button>
          <button
            type="button"
            onClick={() => setQrFormat("merchant")}
            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              qrFormat === "merchant"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Code Marchand Seul
          </button>
        </div>

        {/* High-Resolution QR Code Container */}
        <div className="relative group inline-block">
          <div
            ref={qrRef}
            className="bg-white p-4 rounded-2xl border-2 border-slate-900/10 shadow-md inline-block mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
          >
            <QRCodeSVG
              value={qrPayload}
              size={190}
              bgColor="#FFFFFF"
              fgColor="#020617"
              level="H"
              includeMargin={true}
              className="mx-auto rounded-lg"
            />

            {/* Merchant ID Subtitle */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-800">
              <span className="text-slate-500 font-normal">Marchand:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-900 font-black tracking-wider">
                {merchantCode} ({merchantName})
              </span>
            </div>
          </div>
        </div>

        {/* Action button: Download QR Code */}
        <div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Télécharger le QR Code (HD)</span>
          </button>
        </div>

        {/* Interactive USSD Dial Box */}
        <div className="bg-white rounded-xl border border-amber-200/80 p-3 shadow-2xs space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-amber-800 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-amber-600" />
              Code USSD à composer sur votre téléphone ({method}) :
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 font-mono">
              {formatCurrency(cleanAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200 px-3 py-2 rounded-lg font-mono">
            <span className="text-xs font-black text-amber-950 tracking-wider select-all">
              {ussdCode}
            </span>

            <div className="flex items-center space-x-1.5 ml-2">
              <button
                type="button"
                onClick={handleCopyUssd}
                className="p-1.5 hover:bg-amber-200/60 rounded-md text-amber-800 transition-colors cursor-pointer"
                title="Copier le code USSD"
              >
                {copiedUssd ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-amber-700" />
                )}
              </button>
              <a
                href={`tel:${encodeURIComponent(ussdCode)}`}
                className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                title="Lancer le composeur"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">Appeler</span>
              </a>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            💡 <b>Astuce :</b> Scannez le QR Code depuis votre application {method} ou composez directement le code USSD ci-dessus pour effectuer le transfert en toute sécurité.
          </p>
        </div>

        {/* Security / Escrow guarantee notice */}
        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-emerald-800 font-medium bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Fonds retenus en séquestre sécurisé LGF jusqu'à validation de livraison</span>
        </div>
      </div>
    </div>
  );
}
