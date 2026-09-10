import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useAccounts } from '../context/AccountContext';
import { LabelDetectionResult } from '../types';
import { TARGET_WIDTH_PT, TARGET_HEIGHT_PT } from '../utils/pdfEngine';
import { isDebugMode } from '../utils/debugMode';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  FileText,
  Printer,
  Info,
} from 'lucide-react';

interface LabelPreviewProps {
  pdfBytes?: Uint8Array | null;
  detectionResults: LabelDetectionResult[];
  currentIndex: number;
  onPageChange: (index: number) => void;
  isLoading: boolean;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
  pdfBytes,
  detectionResults,
  currentIndex,
  onPageChange,
  isLoading,
}) => {
  const { activeAccount } = useAccounts();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const activeLoadingTaskRef = useRef<any>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'processed' | 'original' | 'split'>('processed');
  const [showInspection, setShowInspection] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const currentDetection = detectionResults[currentIndex];
  const totalPages = detectionResults.length;

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      if (!pdfBytes || !canvasRef.current || totalPages === 0) return;
      setIsRendering(true);

      // Cancel any ongoing render task before starting a new one on this canvas
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {
          // ignore
        }
        activeRenderTaskRef.current = null;
      }

      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        activeLoadingTaskRef.current = loadingTask;
        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdfDoc.getPage(currentIndex + 1);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Normalized 4x6 Canvas Coordinates (288 x 432 pt) scaled by canvasScale
        const canvasScale = 2.5 * zoomLevel; // Sharp thermal resolution
        canvas.width = TARGET_WIDTH_PT * canvasScale;
        canvas.height = TARGET_HEIGHT_PT * canvasScale;

        // Clear canvas with crisp thermal white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Normalize source PDF page geometry proportionally into 4x6 frame
        const srcViewport = page.getViewport({ scale: 1.0 });
        const docScale = Math.min(TARGET_WIDTH_PT / srcViewport.width, TARGET_HEIGHT_PT / srcViewport.height, 1.0);
        const scaledDocWidth = srcViewport.width * docScale;
        const offsetX = (TARGET_WIDTH_PT - scaledDocWidth) / 2;
        const offsetY = 0; // Top-aligned

        // Render source PDF page onto the normalized 4x6 canvas
        ctx.save();
        ctx.translate(offsetX * canvasScale, offsetY * canvasScale);
        const pageViewport = page.getViewport({ scale: docScale * canvasScale });
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: pageViewport,
          canvas,
        } as any);
        activeRenderTaskRef.current = renderTask;
        await renderTask.promise;
        ctx.restore();

        activeRenderTaskRef.current = null;

        if (isCancelled) return;

        // If viewMode is 'processed' or 'split', draw the promotional overlay onto the canvas in the verified safe whitespace
        // MANDATORY HARD INVARIANT: Must pass isPlacementValid and be below complete invoice
        if (
          (viewMode === 'processed' || viewMode === 'split') &&
          currentDetection &&
          currentDetection.isPlacementValid &&
          currentDetection.isWhitespaceSufficient &&
          !currentDetection.collisionDetected &&
          currentDetection.overlayConfig &&
          currentDetection.overlayConfig.mode !== 'insufficient'
        ) {
          await drawPromotionalOverlayOnCanvas(
            ctx,
            canvas.width,
            canvas.height,
            canvasScale,
            currentDetection,
            activeAccount
          );
        }

        // If Debug & Inspection Mode is toggled on, draw visual bounding boxes
        if (isDebugMode() && showInspection && currentDetection) {
          drawInspectionOverlays(
            ctx,
            canvas.width,
            canvas.height,
            canvasScale,
            currentDetection
          );
        }
      } catch (err: any) {
        // Ignore normal cancellation exceptions when user navigates or zooms quickly
        if (err?.name === 'RenderingCancelledException' || err?.message?.includes('cancelled')) {
          return;
        }
        console.error('Error rendering label preview on canvas:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {
          // ignore
        }
        activeRenderTaskRef.current = null;
      }
    };
  }, [pdfBytes, currentIndex, zoomLevel, viewMode, showInspection, activeAccount, currentDetection]);

  /**
   * Draws the promotional overlay on the canvas preview
   */
  const drawPromotionalOverlayOnCanvas = async (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    detection: LabelDetectionResult,
    account: typeof activeAccount
  ) => {
    const config = detection.overlayConfig;
    if (!config || config.mode === 'insufficient' || config.totalHeight <= 0) return;

    const startY = config.startY * scale;
    const availableH = config.totalHeight * scale;

    // Background safe fill for thermal simulation
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8 * scale, startY, canvasWidth - 16 * scale, availableH + 2 * scale);

    // Subtle divider line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(0.5, 1 * (config.scaleFactor || 1)) * scale;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(16 * scale, startY);
    ctx.lineTo(canvasWidth - 16 * scale, startY);
    ctx.stroke();

    const tmpl = account.messageTemplate;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';

    let curY = startY + (config.dividerGap || 2.5) * scale;

    // 1. Heading (Centered)
    if (config.headingFontSize > 0 && tmpl.heading) {
      curY += config.headingFontSize * scale;
      ctx.font = `bold ${config.headingFontSize * scale}px system-ui, sans-serif`;
      ctx.fillText(tmpl.heading, canvasWidth / 2, curY);
      curY += config.spacing * scale;
    }

    // 2. Review text (Centered, all configured lines)
    if (config.reviewFontSize > 0 && tmpl.reviewMessage) {
      ctx.font = `normal ${config.reviewFontSize * scale}px system-ui, sans-serif`;
      ctx.fillStyle = '#1a1a1a';
      const lines = tmpl.reviewMessage.split('\n').filter(Boolean);
      for (const line of lines) {
        curY += config.reviewFontSize * scale;
        ctx.fillText(line, canvasWidth / 2, curY);
        curY += config.spacing * 0.75 * scale;
      }
    }

    // 3. Store CTA (Centered)
    if (config.storeCTAFontSize > 0 && tmpl.storeCTA) {
      curY += config.storeCTAFontSize * scale;
      ctx.font = `bold ${config.storeCTAFontSize * scale}px system-ui, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.fillText(tmpl.storeCTA, canvasWidth / 2, curY);
      curY += config.spacing * scale;
    }

    // 4. Sub CTA / Highlights line (Centered)
    if (config.subCTAFontSize > 0 && tmpl.subCTA) {
      curY += config.subCTAFontSize * scale;
      ctx.font = `normal ${config.subCTAFontSize * scale}px system-ui, sans-serif`;
      ctx.fillStyle = '#333333';
      ctx.fillText(tmpl.subCTA, canvasWidth / 2, curY);
      curY += config.spacing * 0.7 * scale;
    }

    // 5. Draw QR code image (Horizontally Centered)
    if (config.qrSize > 0 && account.generatedQRCode) {
      try {
        const img = new Image();
        img.src = account.generatedQRCode;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        const qrPx = config.qrSize * scale;
        const qrX = (canvasWidth - qrPx) / 2;
        ctx.drawImage(img, qrX, curY, qrPx, qrPx);
        curY += qrPx + config.spacing * scale;
      } catch (e) {
        // ignore
      }
    }

    // 6. Promotional Footer (Centered)
    if (config.footerFontSize > 0 && tmpl.footer) {
      curY += config.footerFontSize * scale;
      ctx.font = `normal ${config.footerFontSize * scale}px system-ui, sans-serif`;
      ctx.fillStyle = '#222222';
      ctx.fillText(tmpl.footer, canvasWidth / 2, curY);
    }
  };

  /**
   * Draws visual boundaries for inspection / debug mode:
   * RED: Protected original content (Upper label, Barcode, Customer info)
   * BLUE: Detected complete invoice boundary (Table columns, product rows, totals, disclaimers)
   * GREEN: Verified safe promotional area
   * PURPLE: Final promotional bounding box
   */
  const drawInspectionOverlays = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scale: number,
    detection: LabelDetectionResult
  ) => {
    const invStartY = (detection.invoiceStartTopY || 160) * scale;
    const invEndY = detection.invoiceEndingY * scale;

    // 1. RED: Protected Original Content (Upper Shipping Label & Barcode zone)
    ctx.strokeStyle = '#ef4444'; // red-500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(6, 6, canvasWidth - 12, invStartY - 10);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.04)';
    ctx.fillRect(6, 6, canvasWidth - 12, invStartY - 10);

    // Red badge
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 10, 155, 15);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 Protected Label & Barcode', 14, 21);

    // 2. BLUE: Detected Complete Invoice Boundary
    const invHeight = Math.max(20, invEndY - invStartY);
    ctx.strokeStyle = '#3b82f6'; // blue-500
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(6, invStartY, canvasWidth - 12, invHeight);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.fillRect(6, invStartY, canvasWidth - 12, invHeight);

    // Blue badge
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(10, invStartY + 4, 185, 15);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔵 Complete Invoice Boundary (Verified)', 14, invStartY + 15);

    // 2.5 ORANGE: Final Invoice Disclaimer Region
    if (detection.invoiceDisclaimerRegion) {
      const discX = detection.invoiceDisclaimerRegion.x * scale;
      const discY = detection.invoiceDisclaimerRegion.y * scale;
      const discW = detection.invoiceDisclaimerRegion.width * scale;
      const discH = detection.invoiceDisclaimerRegion.height * scale;

      ctx.strokeStyle = '#f97316'; // orange-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(discX, discY, discW, discH);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
      ctx.fillRect(discX, discY, discW, discH);

      // Orange badge
      ctx.fillStyle = '#f97316';
      ctx.fillRect(discX + 4, discY + 2, 175, 13);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🟠 Final Invoice Disclaimer (Verified)', discX + 8, discY + 11);
    }

    // 3. GREEN: Verified Safe Promotional Area
    const safeH = detection.availableWhitespaceHeight * scale;
    if (safeH > 10) {
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(6, invEndY, canvasWidth - 12, safeH);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(6, invEndY, canvasWidth - 12, safeH);

      // Green badge
      ctx.fillStyle = '#10b981';
      ctx.fillRect(10, invEndY + 4, 175, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🟢 Safe Promotional Area (${Math.round(detection.availableWhitespaceHeight)} pt)`, 14, invEndY + 15);
    }

    // 4. PURPLE: Final Promotional Bounding Box
    if (detection.overlayConfig && detection.overlayConfig.mode !== 'insufficient') {
      const pStartY = detection.overlayConfig.startY * scale;
      const pHeight = detection.overlayConfig.totalHeight * scale;
      ctx.strokeStyle = '#a855f7'; // purple-500
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(10, pStartY, canvasWidth - 20, pHeight);

      // Purple badge
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(canvasWidth - 145, pStartY + 2, 135, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🟣 Final Centered Promotion', canvasWidth - 140, pStartY + 12);
    }
  };

  if (!pdfBytes || totalPages === 0) {
    return (
      <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-sm text-center flex flex-col items-center justify-center min-h-[425px]">
        <div className="w-16 h-16 rounded-2xl bg-[#0d0d0d] border border-white/5 flex items-center justify-center text-white/40 mb-3">
          <Eye className="w-8 h-8 text-[#c9a57b]" />
        </div>
        <h3 className="text-base font-semibold text-white">No Label Loaded for Preview</h3>
        <p className="text-xs text-white/40 max-w-sm mt-1">
          Upload a Meesho PDF to preview the 4×6 print-ready label output.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 shadow-sm overflow-hidden flex flex-col">
      {/* Preview Toolbar */}
      <div className="p-3.5 bg-[#0d0d0d] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation & Counter */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg border border-white/10 bg-[#141414] hover:bg-[#1a1a1a] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Label"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          <span className="text-xs font-semibold text-white">
            Label {currentIndex + 1} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentIndex + 1))}
            disabled={currentIndex >= totalPages - 1}
            className="p-1.5 rounded-lg border border-white/10 bg-[#141414] hover:bg-[#1a1a1a] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Label"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setViewMode('processed')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'processed'
                ? 'bg-[#c9a57b] text-black font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            4×6 With Promotion
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'original'
                ? 'bg-[#c9a57b] text-black font-bold shadow-xs'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Original
          </button>
        </div>

        {/* Inspection Mode & Zoom */}
        <div className="flex items-center space-x-2">
          {isDebugMode() && (
            <button
              onClick={() => setShowInspection(!showInspection)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center space-x-1.5 ${
                showInspection
                  ? 'bg-[#c9a57b]/15 border-[#c9a57b]/30 text-[#c9a57b]'
                  : 'bg-[#141414] border-white/10 text-white/70 hover:bg-white/5'
              }`}
              title="Toggle Inspection Outlines (Invoice end, Safe whitespace)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspection Lines</span>
            </button>
          )}

          <div className="flex items-center bg-[#141414] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="p-1 text-white/60 hover:text-white hover:bg-white/5 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-white/80">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1 text-white/60 hover:text-white hover:bg-white/5 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        className="flex-1 bg-[#0a0a0a] p-3 sm:p-4 flex items-center justify-center overflow-auto min-h-[405px] sm:min-h-[450px] max-h-[585px]"
      >
        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 bg-white max-w-full">
          <canvas ref={canvasRef} className="block max-w-full h-auto" />
          {isRendering && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs text-white font-medium">
              Updating 4×6 Preview...
            </div>
          )}
        </div>
      </div>

      {/* Inspection Mode Boundary Legend - Only visible in Developer/Debug Mode */}
      {isDebugMode() && showInspection && (
        <div className="px-4 py-2 bg-[#121212] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="font-semibold text-white/80">Debug Boundaries:</span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center space-x-1.5 text-red-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-red-500/30 border border-red-500 inline-block"></span>
              <span>Protected Upper Label & Barcode</span>
            </span>
            <span className="flex items-center space-x-1.5 text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500/30 border border-blue-500 inline-block"></span>
              <span>Detected Complete Invoice (Verified)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/30 border border-emerald-500 inline-block"></span>
              <span>Safe Promotional Area</span>
            </span>
            <span className="flex items-center space-x-1.5 text-purple-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-500/30 border border-purple-500 inline-block"></span>
              <span>Final Promotion Placement</span>
            </span>
          </div>
        </div>
      )}

      {/* Footer Info Bar */}
      <div className="p-3 bg-[#0d0d0d] border-t border-white/5 text-[11px] text-white/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Printer className="w-3.5 h-3.5 text-[#c9a57b]" />
          <span>Standard 4×6" Thermal Output</span>
        </div>
        {isDebugMode() ? (
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
              <span>Invoice End: Y = {Math.round(currentDetection?.invoiceEndingY || 0)}pt</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              <span>Safe Space: {Math.round(currentDetection?.availableWhitespaceHeight || 0)}pt</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Print-Ready 4×6</span>
          </div>
        )}
      </div>
    </div>
  );
};
