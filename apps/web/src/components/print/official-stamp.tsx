'use client';

import React from 'react';

interface OfficialStampProps {
  doctorName?: string;
  doctorInpe?: string;
  doctorSpeciality?: string;
  city?: string;
  className?: string;
}

export function OfficialStamp({
  doctorName = 'Dr. Amine Benali',
  doctorInpe = '104829384',
  doctorSpeciality = 'Cardiologie & Maladies Vasculaires',
  city = 'Casablanca',
  className = '',
}: OfficialStampProps) {
  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      {/* Official Circular Moroccan Medical Seal / Stamp in Ink */}
      <div className="relative w-44 h-44 rounded-full border-2 border-dashed border-[#1E3A8A]/80 p-1 flex items-center justify-center transform -rotate-2 hover:rotate-0 transition-transform">
        <div className="w-full h-full rounded-full border border-[#1E3A8A]/90 p-2 flex flex-col items-center justify-between text-center font-serif text-[#1E3A8A]">
          {/* Top Arc Inscription */}
          <div className="text-[9px] font-bold tracking-widest uppercase border-b border-[#1E3A8A]/40 pb-0.5 w-full">
            ROYAUME DU MAROC
          </div>

          {/* Central Body: Doctor Name, Specialty, INPE */}
          <div className="my-auto space-y-0.5">
            <div className="font-extrabold text-[12px] tracking-tight text-[#1E3A8A] font-sans">
              {doctorName.toUpperCase()}
            </div>
            <div className="text-[8px] font-semibold text-[#1E3A8A]/90 max-w-[130px] leading-tight mx-auto">
              {doctorSpeciality}
            </div>
            <div className="inline-block bg-[#1E3A8A]/10 text-[#1E3A8A] text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-[#1E3A8A]/30 mt-0.5">
              INPE : {doctorInpe}
            </div>
          </div>

          {/* Bottom Arc Inscription */}
          <div className="text-[8.5px] font-bold tracking-wider uppercase border-t border-[#1E3A8A]/40 pt-0.5 w-full">
            CONSEIL NATIONAL DE L&apos;ORDRE • {city.toUpperCase()}
          </div>
        </div>

        {/* Realistic Handwritten Doctor Signature Vector overlay */}
        <svg
          className="absolute inset-0 w-full h-full text-[#152e6f] overflow-visible -rotate-6"
          viewBox="0 0 160 160"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Dynamic doctor signature path */}
          <path
            d="M 30,105 C 45,75 52,60 62,85 C 72,110 80,70 95,90 C 110,110 120,65 135,78 C 145,86 125,120 100,112 C 80,105 130,102 145,100"
            className="opacity-95"
          />
          <path
            d="M 40,95 Q 85,98 130,92"
            strokeWidth="1.6"
            className="opacity-80"
          />
        </svg>

        {/* Authentic Ink Texture Flecks */}
        <div className="absolute top-3 right-6 w-1.5 h-1.5 rounded-full bg-[#1E3A8A]/30"></div>
        <div className="absolute bottom-5 left-8 w-1 h-1 rounded-full bg-[#1E3A8A]/25"></div>
        <div className="absolute top-10 left-4 w-1.5 h-0.5 bg-[#1E3A8A]/30 rotate-45"></div>
      </div>

      <div className="text-center font-mono text-[9px] text-[#1E3A8A]/75 mt-1 font-semibold uppercase tracking-wider">
        Cachet Officiel & Signature
      </div>
    </div>
  );
}
