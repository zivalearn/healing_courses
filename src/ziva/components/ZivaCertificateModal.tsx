import React from 'react';
import { ZivaCertificate } from '../types';
import { Award, CheckCircle, Download, Printer, X, Sparkles, ShieldCheck } from 'lucide-react';

interface ZivaCertificateModalProps {
  certificate: ZivaCertificate;
  isOpen: boolean;
  onClose: () => void;
}

export const ZivaCertificateModal: React.FC<ZivaCertificateModalProps> = ({
  certificate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-black border-2 border-amber-500/60 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl space-y-8 my-8">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full bg-neutral-900 border border-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PRINT / ACTION BAR */}
        <div className="flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

        {/* CERTIFICATE FRAME */}
        <div className="border-4 border-double border-amber-500/40 p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-neutral-950 via-black to-neutral-950 space-y-6 relative overflow-hidden">
          
          <Sparkles className="w-24 h-24 text-amber-500/10 absolute -top-4 -left-4 pointer-events-none" />
          <Award className="w-32 h-32 text-amber-500/10 absolute -bottom-6 -right-6 pointer-events-none" />

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-serif text-amber-400 uppercase tracking-widest font-bold">
              Ziva Executive Masterclass Series
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white mt-2">
              Certificate of Completion
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-serif italic">
              This is to certify that
            </p>
          </div>

          <div className="py-2 border-b-2 border-amber-500/40 max-w-md mx-auto">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-amber-300 tracking-wide">
              {certificate.userName || 'Distinguished Graduate'}
            </h2>
          </div>

          <p className="text-xs text-gray-300 max-w-xl mx-auto leading-relaxed">
            has successfully mastered all curriculum requirements, practical exercises, and modules for the masterclass:
          </p>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white text-pink-400">
            {certificate.courseTitle}
          </h3>

          {/* FOOTER INFO */}
          <div className="pt-8 grid grid-cols-2 gap-4 border-t border-gray-900 text-left text-xs">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Certificate Number</p>
              <p className="font-mono text-amber-400 font-bold">{certificate.certificateNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date Issued</p>
              <p className="text-white font-bold">{new Date(certificate.issuedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Ziva Digital Credential
          </div>

        </div>

      </div>
    </div>
  );
};
