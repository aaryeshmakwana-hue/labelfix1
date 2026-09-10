import React from 'react';
import confetti from 'canvas-confetti';
import { useAccounts } from '../context/AccountContext';
import { ProcessedBatchResult, LabelDetectionResult } from '../types';
import {
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  FileCheck,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface BatchProcessorProps {
  totalLabels: number;
  isProcessing: boolean;
  progressCurrent: number;
  processedResult: ProcessedBatchResult | null;
  onProcessAll: () => Promise<void>;
  onPreviewFirst: () => void;
  detectionResults: LabelDetectionResult[];
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  totalLabels,
  isProcessing,
  progressCurrent,
  processedResult,
  onProcessAll,
  onPreviewFirst,
  detectionResults,
}) => {
  const { activeAccount } = useAccounts();

  const handleDownload = () => {
    if (!processedResult) return;
    const link = document.createElement('a');
    link.href = processedResult.pdfUrl;
    link.download = processedResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Trigger celebration confetti!
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
    });
  };

  const handlePrintDirect = () => {
    if (!processedResult) return;
    const printWindow = window.open(processedResult.pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      try {
        printWindow.print();
      } catch (_) {
        // Fallback for browsers that restrict immediate programmatic print
      }
    }
  };

  const warningCount = detectionResults.filter((r) => r.status === 'warning' || r.status === 'skipped').length;

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-white/5 mb-4">
        <div className="flex items-center space-x-2.5 min-w-0">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c9a57b]/15 text-[#c9a57b] text-xs font-bold flex-shrink-0">
            2
          </span>
          <h2 className="text-sm font-semibold text-white">
            Process & Generate 4×6 Print-Ready PDF
          </h2>
        </div>

        <span className="text-xs font-medium text-white/40 flex-shrink-0">
          Account: <strong className="text-white">{activeAccount ? activeAccount.accountName : 'Standard (No Custom Store)'}</strong>
        </span>
      </div>

      {/* Confirmation & Status Checklist */}
      <div className="bg-[#0d0d0d] rounded-xl p-4 sm:p-5 border border-white/5 mb-5">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 text-xs">
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-white/40 block truncate">
              Labels in Queue
            </span>
            <span className="font-semibold text-white text-sm sm:text-base mt-1 block truncate">
              {totalLabels} {totalLabels === 1 ? 'Label' : 'Labels'}
            </span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-white/40 block truncate">
              Promotional QR
            </span>
            <div className={`font-semibold text-sm sm:text-base flex items-center space-x-1.5 mt-1 ${activeAccount ? 'text-emerald-400' : 'text-white/40'}`}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{activeAccount ? 'Auto Active' : 'Off (Standard)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="mb-5 bg-[#0d0d0d] border border-[#c9a57b]/30 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-bold text-[#c9a57b] mb-2">
            <span className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#c9a57b]" />
              <span>
                Processing Label {progressCurrent} of {totalLabels}...
              </span>
            </span>
            <span>{Math.round((progressCurrent / Math.max(1, totalLabels)) * 100)}%</span>
          </div>

          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#c9a57b] to-[#8a6d4d] h-2 rounded-full transition-all duration-150"
              style={{
                width: `${(progressCurrent / Math.max(1, totalLabels)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Processed Success Banner */}
      {processedResult && !isProcessing && (
        <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white leading-snug">
                ✓ {processedResult.successCount} of {processedResult.totalCount} Labels Successfully Processed
              </h4>
              <p className="text-xs text-white/50 mt-1 leading-relaxed break-words">
                Ready for thermal printing on 4×6" roll paper{' '}
                <span className="text-white/40 break-all font-mono text-[11px]">
                  ({processedResult.fileName})
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-wrap pt-1 border-t border-emerald-500/10">
            <button
              onClick={handleDownload}
              className="px-4 py-2.5 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-[0.98]"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrintDirect}
              className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#222222] text-white border border-white/10 rounded-xl font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap active:scale-[0.98]"
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              <span>Direct Print</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          id="process-all-btn"
          disabled={totalLabels === 0 || isProcessing}
          onClick={onProcessAll}
          className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-bold uppercase tracking-[0.15em] text-xs shadow-md shadow-[#c9a57b]/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all hover:scale-[1.005] active:scale-[0.99]"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Processing Batch ({progressCurrent}/{totalLabels})...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black" />
              <span>Process All {totalLabels} {totalLabels === 1 ? 'Label' : 'Labels'}</span>
            </>
          )}
        </button>

        <button
          onClick={onPreviewFirst}
          disabled={totalLabels === 0 || isProcessing}
          className="px-4 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium text-xs transition-colors disabled:opacity-40"
        >
          Preview Label 1
        </button>
      </div>

      {/* Problem / Skipped Labels Report */}
      {warningCount > 0 && (
        <div className="mt-4 pt-3.5 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                <strong>{warningCount}</strong> {warningCount === 1 ? 'label has' : 'labels have'} cautionary notices (original labels safely preserved without clipping).
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
