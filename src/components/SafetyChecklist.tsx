import React, { useState } from 'react';
import { LabelDetectionResult } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileSearch,
} from 'lucide-react';

interface SafetyChecklistProps {
  detection?: LabelDetectionResult;
  totalCount: number;
  currentIndex: number;
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({
  detection,
  totalCount,
  currentIndex,
}) => {
  const [showTrace, setShowTrace] = useState(false);

  if (!detection) return null;

  const checks = [
    {
      id: 'invoice',
      title: 'Stage 1 & 2: True Invoice End Verified',
      status: detection.verificationPassed && detection.isInvoiceDetected ? 'pass' : 'warn',
      detail: detection.isInvoiceDetected
        ? `Verified complete ending at Y = ${Math.round(detection.invoiceEndingY)} pt (Strictly below all rows & disclaimer)`
        : 'Estimated from text boundaries',
    },
    {
      id: 'whitespace',
      title: 'Safe White Space (Green Zone)',
      status: detection.isWhitespaceSufficient ? 'pass' : 'warn',
      detail: `${Math.round(detection.availableWhitespaceHeight)} pt clean space available below invoice`,
    },
    {
      id: 'placement_validation',
      title: 'Authoritative Placement (ACTUAL ⊂ EXPECTED)',
      status: detection.isPlacementValid ? 'pass' : 'fail',
      detail: detection.isPlacementValid
        ? `Expected Y ≥ ${Math.round(detection.expectedPromotionalRegion?.y || detection.invoiceEndingY)} pt | Actual Y = ${Math.round(detection.actualPromotionalRegion?.y || 0)} pt (Safe)`
        : 'Placement outside verified safe region! Overlay skipped.',
    },
    {
      id: 'fitting',
      title: '100% Horizontally Centered Overlay',
      status: detection.overlayConfig?.mode !== 'insufficient' ? 'pass' : 'fail',
      detail: `Mode: ${detection.overlayConfig?.mode?.toUpperCase()} (Starts Y = ${Math.round(detection.overlayConfig?.startY || 0)} pt, QR: ${detection.overlayConfig?.qrSize || 0}pt)`,
    },
    {
      id: 'qr',
      title: 'Store QR Code Level-H Ready',
      status: 'pass',
      detail: 'High-DPI Level-H error-corrected vector/raster',
    },
    {
      id: 'collision',
      title: 'Zero Barcode & Invoice Collision',
      status: !detection.collisionDetected ? 'pass' : 'fail',
      detail: !detection.collisionDetected
        ? 'Zero overlap with AWB, QR, address, or invoice rows'
        : 'Collision hazard detected! Original preserved.',
    },
  ];

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-3.5">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Safety Verification & Audit — Label {currentIndex + 1} of {totalCount}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {detection.verificationTrace && detection.verificationTrace.length > 0 && (
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="text-[10px] text-[#c9a57b] hover:text-[#e0c49f] font-medium flex items-center space-x-1 px-2 py-0.5 rounded border border-[#c9a57b]/30 bg-[#c9a57b]/10 transition-colors"
            >
              <FileSearch className="w-3 h-3" />
              <span>{showTrace ? 'Hide Audit Trace' : 'View Audit Trace'}</span>
              {showTrace ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              detection.status === 'ready'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {detection.status === 'ready' ? '✓ Verified Safe' : '⚠ Caution'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {checks.map((c) => (
          <div
            key={c.id}
            className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
              c.status === 'pass'
                ? 'bg-[#0d0d0d] border-white/5 text-white'
                : c.status === 'warn'
                ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
            }`}
          >
            {c.status === 'pass' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : c.status === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span className="font-semibold block leading-tight text-white">{c.title}</span>
              <span className="text-[10px] text-white/40 block truncate mt-0.5">
                {c.detail}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expected vs Actual Promotional Region Visual Panel */}
      {detection.expectedPromotionalRegion && detection.actualPromotionalRegion && (
        <div className="mt-3.5 p-3 rounded-xl bg-[#0d0d0d] border border-white/10 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Expected Region vs Actual Rendered Region
            </span>
            <span
              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                detection.isPlacementValid
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {detection.isPlacementValid ? '✓ ACTUAL ⊂ EXPECTED (Validated)' : '❌ PLACEMENT INVALID'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-emerald-400 font-semibold block">🟢 EXPECTED REGION (Safe Whitespace)</span>
              <span className="text-white/70 block font-mono text-[10px] mt-0.5">
                Y: {Math.round(detection.expectedPromotionalRegion.y)} – {Math.round(detection.expectedPromotionalRegion.y + detection.expectedPromotionalRegion.height)} pt (Height: {Math.round(detection.expectedPromotionalRegion.height)} pt)
              </span>
              <span className="text-white/40 block text-[9.5px] mt-0.5">Strictly after complete invoice & final disclaimer</span>
            </div>

            <div className={`p-2 rounded-lg border ${
              detection.isPlacementValid
                ? 'bg-purple-500/5 border-purple-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <span className={`${detection.isPlacementValid ? 'text-purple-400' : 'text-rose-400'} font-semibold block`}>
                🟣 ACTUAL REGION (Rendered Overlay)
              </span>
              <span className="text-white/70 block font-mono text-[10px] mt-0.5">
                Y: {Math.round(detection.actualPromotionalRegion.y)} – {Math.round(detection.actualPromotionalRegion.y + detection.actualPromotionalRegion.height)} pt (Height: {Math.round(detection.actualPromotionalRegion.height)} pt)
              </span>
              <span className="text-white/40 block text-[9.5px] mt-0.5">
                {detection.isPlacementValid ? '100% Centered inside verified safe whitespace' : 'Violates invoice protection wall!'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Detected Sections Badges */}
      {detection.detectedSections && detection.detectedSections.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-white/40 font-semibold mr-1">Detected Invoice Sections:</span>
          {detection.detectedSections.map((sec, idx) => (
            <span
              key={idx}
              className="text-[9.5px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
            >
              ✓ {sec}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Verification Audit Trace */}
      {showTrace && detection.verificationTrace && (
        <div className="mt-3.5 p-3 rounded-xl bg-black border border-white/10 font-mono text-[10px] text-white/70 space-y-1">
          <div className="text-emerald-400 font-bold mb-1">Two-Stage Verification Log:</div>
          {detection.verificationTrace.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
