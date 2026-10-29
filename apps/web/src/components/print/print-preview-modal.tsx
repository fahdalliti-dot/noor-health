'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/button';
import { MedicalPrintDocument, MedicalPrintDocumentProps } from './medical-print-document';

interface PrintPreviewModalProps extends MedicalPrintDocumentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintPreviewModal({
  open,
  onOpenChange,
  ...docProps
}: PrintPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    // Trigger standard high-resolution print-to-PDF flow
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-stone-100 rounded-2xl border border-stone-300 max-w-4xl w-full my-auto shadow-2xl flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-white border-b border-stone-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-terracotta-50 text-terracotta-700 flex items-center justify-center text-base font-bold">
              🖨
            </span>
            <div>
              <div className="text-sm font-bold text-stone-900">
                Aperçu d&apos;Impression Officielle A4 — Noor Soin Numérique
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                Réf : {docProps.documentNumber} • Cachet, INPE et QR Code d&apos;authenticité certifiés
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Fermer
            </Button>
            
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="px-3.5 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>📥</span> {downloading ? 'Préparation...' : 'Télécharger PDF'}
            </button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>🖨</span> Imprimer (Format A4)
            </Button>
          </div>
        </div>

        {/* Printable Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-200/50 flex justify-center">
          <div className="medical-print-wrapper shadow-xl bg-white rounded-md">
            <MedicalPrintDocument {...docProps} />
          </div>
        </div>

      </div>
    </div>
  );
}
