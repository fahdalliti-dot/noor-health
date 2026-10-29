'use client';

import React from 'react';

interface QrVerificationProps {
  documentId: string;
  inpe: string;
  patientName: string;
  date: string;
  size?: number;
}

export function QrVerification({
  documentId,
  inpe,
  patientName,
  date,
  size = 96,
}: QrVerificationProps) {
  // Generate a deterministic pseudo-SHA256 fingerprint based on document parameters
  const seedString = `${documentId}:${inpe}:${patientName}:${date}`;
  let hashVal = 0;
  for (let i = 0; i < seedString.length; i++) {
    hashVal = ((hashVal << 5) - hashVal + seedString.charCodeAt(i)) | 0;
  }
  const hexPart1 = Math.abs(hashVal).toString(16).padStart(8, 'a');
  const hexPart2 = Math.abs((hashVal ^ 0x5a5a5a5a)).toString(16).padStart(8, 'f');
  const hexPart3 = Math.abs((hashVal ^ 0x3c3c3c3c)).toString(16).padStart(8, '9');
  const shortHash = `${hexPart1.slice(0, 4)}-${hexPart2.slice(0, 4)}-${hexPart3.slice(0, 4)}`.toUpperCase();

  const verificationUrl = `https://noor.sante.ma/v/${documentId}?inpe=${inpe}&sig=${hexPart1}`;

  return (
    <div className="flex items-center gap-3">
      {/* Crisp Vector QR Code */}
      <div
        className="bg-white p-1.5 rounded border border-stone-200/90 shadow-2xs shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
        title={`URL de vérification: ${verificationUrl}`}
      >
        <svg
          viewBox="0 0 33 33"
          width="100%"
          height="100%"
          shapeRendering="crispEdges"
          className="text-stone-900 fill-current"
        >
          {/* Background */}
          <rect width="33" height="33" fill="#ffffff" />
          
          {/* Top-Left Finder Pattern (7x7) */}
          <rect x="2" y="2" width="7" height="7" fill="currentColor" />
          <rect x="3" y="3" width="5" height="5" fill="#ffffff" />
          <rect x="4" y="4" width="3" height="3" fill="currentColor" />

          {/* Top-Right Finder Pattern (7x7) */}
          <rect x="24" y="2" width="7" height="7" fill="currentColor" />
          <rect x="25" y="3" width="5" height="5" fill="#ffffff" />
          <rect x="26" y="4" width="3" height="3" fill="currentColor" />

          {/* Bottom-Left Finder Pattern (7x7) */}
          <rect x="2" y="24" width="7" height="7" fill="currentColor" />
          <rect x="3" y="25" width="5" height="5" fill="#ffffff" />
          <rect x="4" y="26" width="3" height="3" fill="currentColor" />

          {/* Alignment & Timing Patterns */}
          <rect x="10" y="5" width="1" height="1" fill="currentColor" />
          <rect x="12" y="5" width="1" height="1" fill="currentColor" />
          <rect x="14" y="5" width="1" height="1" fill="currentColor" />
          <rect x="16" y="5" width="1" height="1" fill="currentColor" />
          <rect x="18" y="5" width="1" height="1" fill="currentColor" />
          <rect x="20" y="5" width="1" height="1" fill="currentColor" />
          <rect x="22" y="5" width="1" height="1" fill="currentColor" />

          <rect x="5" y="10" width="1" height="1" fill="currentColor" />
          <rect x="5" y="12" width="1" height="1" fill="currentColor" />
          <rect x="5" y="14" width="1" height="1" fill="currentColor" />
          <rect x="5" y="16" width="1" height="1" fill="currentColor" />
          <rect x="5" y="18" width="1" height="1" fill="currentColor" />
          <rect x="5" y="20" width="1" height="1" fill="currentColor" />
          <rect x="5" y="22" width="1" height="1" fill="currentColor" />

          {/* Center Data Matrix Grid (Simulated high-density QR payload) */}
          <rect x="10" y="8" width="2" height="1" fill="currentColor" />
          <rect x="13" y="8" width="1" height="2" fill="currentColor" />
          <rect x="16" y="9" width="3" height="1" fill="currentColor" />
          <rect x="20" y="8" width="2" height="2" fill="currentColor" />

          <rect x="9" y="11" width="2" height="2" fill="currentColor" />
          <rect x="12" y="12" width="1" height="3" fill="currentColor" />
          <rect x="14" y="11" width="2" height="1" fill="currentColor" />
          <rect x="17" y="12" width="1" height="2" fill="currentColor" />
          <rect x="19" y="11" width="3" height="1" fill="currentColor" />
          <rect x="23" y="12" width="1" height="2" fill="currentColor" />

          <rect x="10" y="15" width="3" height="1" fill="currentColor" />
          <rect x="14" y="14" width="2" height="2" fill="currentColor" />
          <rect x="17" y="15" width="2" height="2" fill="currentColor" />
          <rect x="20" y="14" width="2" height="1" fill="currentColor" />

          <rect x="9" y="18" width="2" height="1" fill="currentColor" />
          <rect x="12" y="18" width="2" height="2" fill="currentColor" />
          <rect x="15" y="19" width="1" height="2" fill="currentColor" />
          <rect x="17" y="18" width="3" height="1" fill="currentColor" />
          <rect x="21" y="18" width="1" height="2" fill="currentColor" />
          <rect x="23" y="19" width="2" height="1" fill="currentColor" />

          <rect x="10" y="21" width="1" height="3" fill="currentColor" />
          <rect x="12" y="22" width="2" height="1" fill="currentColor" />
          <rect x="15" y="22" width="2" height="2" fill="currentColor" />
          <rect x="18" y="21" width="1" height="3" fill="currentColor" />
          <rect x="20" y="22" width="2" height="1" fill="currentColor" />

          <rect x="10" y="25" width="3" height="1" fill="currentColor" />
          <rect x="14" y="26" width="2" height="1" fill="currentColor" />
          <rect x="17" y="25" width="1" height="2" fill="currentColor" />
          <rect x="19" y="26" width="3" height="2" fill="currentColor" />
          <rect x="23" y="25" width="1" height="2" fill="currentColor" />
          <rect x="25" y="24" width="2" height="2" fill="currentColor" />
          <rect x="28" y="25" width="2" height="1" fill="currentColor" />

          <rect x="11" y="28" width="2" height="2" fill="currentColor" />
          <rect x="14" y="29" width="3" height="1" fill="currentColor" />
          <rect x="18" y="28" width="2" height="2" fill="currentColor" />
          <rect x="22" y="29" width="2" height="1" fill="currentColor" />
          <rect x="26" y="28" width="1" height="3" fill="currentColor" />
          <rect x="28" y="29" width="2" height="2" fill="currentColor" />
        </svg>
      </div>

      {/* Security Metadata & Verification Note */}
      <div className="space-y-0.5 text-left leading-tight">
        <div className="flex items-center gap-1 text-[10px] font-bold text-terracotta-700 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          Vérification d&apos;Authenticité
        </div>
        <div className="text-[10px] text-stone-700 font-mono">
          N° {documentId}
        </div>
        <div className="text-[9px] text-stone-500 font-mono">
          SHA-256 : <span className="font-semibold text-stone-700">{shortHash}</span>
        </div>
        <div className="text-[9px] text-stone-400">
          Scannez pour vérifier la signature sur <span className="underline">noor.sante.ma</span>
        </div>
      </div>
    </div>
  );
}
