import React, { useState } from "react";
import { Copy, Check, Download, ShieldCheck, QrCode, Building, CreditCard } from "lucide-react";
import { ECOBANK_QR_IMAGE_DATA } from "../assets/images/ecobankQrData";

interface EcobankPaymentCardProps {
  amount?: number;
  formatCurrency?: (value: number) => string;
  onSuccess?: () => void;
}

export default function EcobankPaymentCard({
  amount,
  formatCurrency,
  onSuccess
}: EcobankPaymentCardProps) {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const bankDetails = {
    bank: "Ecobank Togo",
    service: "PI-UEMOA QR",
    accountName: "SABI PROSPERE",
    referenceId: "5f262a89-7861-4e0b-8491-2178bd47f782",
    codeUemoa: "00228-PI-UEMOA-ECOBANK-LGF"
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(bankDetails.referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleCopyAccount = () => {
    const fullText = `Banque: ${bankDetails.bank}\nService: ${bankDetails.service}\nNom du compte: ${bankDetails.accountName}\nID Référence: ${bankDetails.referenceId}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleDownloadQr = () => {
    // Generate an image download for the QR code
    const imgElement = document.getElementById("ecobank-qr-image") as HTMLImageElement;
    if (imgElement) {
      const link = document.createElement("a");
      link.href = imgElement.src;
      link.download = `Ecobank_PI-UEMOA_QR_LGFMall_${bankDetails.referenceId.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl space-y-6">
      {/* Card Header with Bank Badge */}
      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-sky-600/20 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/30 shadow-inner">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-sky-400 uppercase tracking-widest font-mono">Ecobank</span>
              <span className="bg-sky-500/20 text-sky-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-sky-400/30">
                PI-UEMOA
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-display">Virement Bancaire & QR Code UEMOA</h3>
          </div>
        </div>
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
      </div>

      {/* Amount Display */}
      {amount && formatCurrency && (
        <div className="bg-emerald-900/40 p-4 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">Montant du Paiement :</span>
          <span className="text-xl font-extrabold text-amber-400 font-mono">{formatCurrency(amount)}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* QR Code Column */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-900 space-y-3 text-center shadow-lg">
          <div className="relative group inline-block mx-auto">
            <img
              id="ecobank-qr-image"
              src={ECOBANK_QR_IMAGE_DATA}
              alt="Ecobank PI-UEMOA QR Code SABI PROSPERE"
              referrerPolicy="no-referrer"
              className="w-56 h-auto object-contain mx-auto rounded-xl border border-slate-200 p-1 bg-white shadow-md"
            />
            <div className="mt-2 text-[10px] font-bold text-sky-800 font-mono flex items-center justify-center space-x-1">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scannez avec Ecobank Mobile ou toute app UEMOA</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Télécharger le QR Code</span>
          </button>
        </div>

        {/* Bank Information Details */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-800/50 space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">Banque :</span>
              <span className="text-sm font-extrabold text-white">{bankDetails.bank}</span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">Service de Paiement :</span>
              <span className="text-xs font-bold text-sky-300 font-mono">{bankDetails.service}</span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">Nom du Compte Bénéficiaire :</span>
              <span className="text-sm font-extrabold text-amber-400">{bankDetails.accountName}</span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block font-mono">ID de Référence Unique :</span>
              <div className="mt-1 bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex items-center justify-between font-mono text-[11px] text-amber-300 break-all select-all">
                <span>{bankDetails.referenceId}</span>
              </div>
            </div>
          </div>

          {/* Action Copy Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleCopyRef}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md shadow-sky-600/20"
            >
              {copiedRef ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedRef ? "ID Copié !" : "Copier Référence ID"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAccount}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              {copiedAccount ? <Check className="w-4 h-4 text-emerald-300" /> : <CreditCard className="w-4 h-4 text-sky-400" />}
              <span>{copiedAccount ? "Infos Copiées !" : "Copier RIB Complet"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-emerald-950/60 rounded-xl border border-emerald-800/40 text-[11px] text-slate-300 leading-relaxed">
        💡 <b>Instruction virement :</b> Après scan ou virement bancaire, veuillez renseigner l'ID Référence <b>{bankDetails.referenceId}</b> dans le libellé de votre transaction pour validation instantanée de votre séquestre LGF.
      </div>
    </div>
  );
}
