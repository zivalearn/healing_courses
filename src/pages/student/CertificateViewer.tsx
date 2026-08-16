import React, { useRef } from 'react';
import { Certificate } from '../../types/certificate';
import { Award, Download, Printer, CheckCircle2, ShieldCheck, X, Sparkles, Share2 } from 'lucide-react';

interface CertificateViewerProps {
  certificate: Certificate;
  studentName: string;
  courseTitle: string;
  onClose?: () => void;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  studentName,
  courseTitle,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = certificate.issued_at
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-base text-white">Accredited Certificate</h3>
              <p className="text-xs text-slate-400">ID: {certificate.certificate_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Certificate Frame */}
        <div className="p-6 sm:p-12 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-3xl bg-amber-50/40 border-[12px] border-amber-800/20 p-8 sm:p-12 rounded-2xl relative shadow-xl text-center space-y-6 print:border-8 print:p-8 print:shadow-none print:m-0"
            style={{
              backgroundImage: 'radial-gradient(circle at center, rgba(254, 243, 199, 0.5) 0%, rgba(255, 255, 255, 0.9) 100%)',
            }}
          >
            {/* Corner Decorative Accents */}
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-700/60" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-700/60" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-700/60" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-700/60" />

            {/* Header Badge & Title */}
            <div className="space-y-2 pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Heer Institute of Healing & Consciousness</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-wide pt-2">
                Certificate of Completion
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
                This is to certify that
              </p>
            </div>

            {/* Recipient Name */}
            <div className="py-2 border-b-2 border-amber-800/20 max-w-md mx-auto">
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-amber-900 capitalize">
                {studentName}
              </h2>
            </div>

            {/* Completion Description */}
            <div className="space-y-2 max-w-xl mx-auto">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                has successfully mastered all modules, practical assessments, and required coursework for the certified program:
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 text-indigo-950">
                {courseTitle}
              </h3>
            </div>

            {/* Verification Seal & Details */}
            <div className="pt-6 grid grid-cols-3 items-end border-t border-amber-800/10 text-left">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500">Date Issued</p>
                <p className="text-xs font-serif font-bold text-slate-900">{formattedDate}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500 rounded-full mx-auto flex items-center justify-center text-white shadow-lg border-4 border-amber-300">
                  <Award className="w-10 h-10" />
                </div>
                <span className="text-[9px] font-bold text-amber-900 uppercase tracking-widest block pt-1">
                  OFFICIAL SEAL
                </span>
              </div>

              <div className="text-right space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500">Certificate No.</p>
                <p className="text-xs font-mono font-bold text-slate-900">{certificate.certificate_number}</p>
              </div>
            </div>

            {/* Bottom Verification Footer */}
            <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-200">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Authentic Credential
              </span>
              <span>Verify ID: {certificate.verification_token || certificate.certificate_number}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
