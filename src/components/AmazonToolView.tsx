import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Layers,
  ArrowLeft,
  Printer,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Tag,
  Info,
  Maximize2,
  Store,
  Crop,
} from 'lucide-react';
import { AppRoute } from '../utils/router';
import {
  AmazonBatchResult,
  AmazonLabelPairResult,
  processAmazonPDF,
} from '../amazon';

interface AmazonToolViewProps {
  onNavigate: (route: AppRoute) => void;
  onOpenHelpModal: () => void;
}

export const AmazonToolView: React.FC<AmazonToolViewProps> = ({
  onNavigate,
  onOpenHelpModal,
}) => {
  // File & Processed Data State
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [batchResult, setBatchResult] = useState<AmazonBatchResult | null>(null);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  // Processing UI State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPair, setProgressPair] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview State
  const [viewMode, setViewMode] = useState<'processed' | 'source-label' | 'source-invoice'>('processed');
  const [selectedInvoiceSubPageIndex, setSelectedInvoiceSubPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Canvas Refs & Cancel Tracking
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activePdfUrlRef = useRef<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (activePdfUrlRef.current) {
        try {
          URL.revokeObjectURL(activePdfUrlRef.current);
        } catch (_) {}
      }
    };
  }, []);

  // Handle PDF file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset input value immediately so re-selecting the same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      if (activePdfUrlRef.current) {
        try {
          URL.revokeObjectURL(activePdfUrlRef.current);
        } catch (_) {}
        activePdfUrlRef.current = null;
      }
      setBatchResult(null);
      setOriginalPdfBytes(null);
      setErrorMessage('Please upload a valid PDF document containing Amazon labels.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      await processUploadedBytes(new Uint8Array(buffer), file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file. Please try again.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag & drop handlers
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      if (activePdfUrlRef.current) {
        try {
          URL.revokeObjectURL(activePdfUrlRef.current);
        } catch (_) {}
        activePdfUrlRef.current = null;
      }
      setBatchResult(null);
      setOriginalPdfBytes(null);
      setErrorMessage('Please upload a valid PDF document containing Amazon labels.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      await processUploadedBytes(new Uint8Array(buffer), file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the dropped file. Please try again.');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Core processing function
  const processUploadedBytes = async (bytes: Uint8Array, name: string) => {
    if (activePdfUrlRef.current) {
      try {
        URL.revokeObjectURL(activePdfUrlRef.current);
      } catch (_) {}
      activePdfUrlRef.current = null;
    }
    if (activeRenderTaskRef.current) {
      try {
        activeRenderTaskRef.current.cancel();
      } catch (_) {}
      activeRenderTaskRef.current = null;
    }

    setErrorMessage(null);
    setBatchResult(null); // Clear previous results so stale data is never shown
    setOriginalPdfBytes(bytes);
    setFileName(name);
    setIsProcessing(true);
    setProgressPair(0);
    setProgressTotal(0);
    setSelectedPairIndex(0);
    setSelectedInvoiceSubPageIndex(0);
    setViewMode('processed');
    setZoomLevel(1.0);

    try {
      const result = await processAmazonPDF(
        bytes,
        name,
        (current, total, msg) => {
          setProgressPair(current);
          setProgressTotal(total);
          setProgressMessage(msg);
        }
      );

      activePdfUrlRef.current = result.pdfUrl;
      setBatchResult(result);
    } catch (err: any) {
      console.error('Amazon PDF processing error:', err);
      setErrorMessage(err.message || 'Failed to process Amazon PDF.');
      setBatchResult(null);
      setOriginalPdfBytes(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Print handler
  const handleDirectPrint = () => {
    if (!batchResult) return;
    const printWindow = window.open(batchResult.pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  // Download PDF handler
  const handleDownload = () => {
    if (!batchResult) return;
    const link = document.createElement('a');
    link.href = batchResult.pdfUrl;
    link.download = batchResult.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active selected order
  const activePair: AmazonLabelPairResult | undefined =
    batchResult?.pairResults[selectedPairIndex];

  // Render preview onto canvas
  useEffect(() => {
    let isCancelled = false;

    const renderPreviewCanvas = async () => {
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {}
        activeRenderTaskRef.current = null;
      }

      const canvas = previewCanvasRef.current;
      if (!canvas) return;

      try {
        if (viewMode === 'processed' && batchResult) {
          // Render from processed PDF: 1 page per shipping label, with overlay already added
          const loadingTask = pdfjsLib.getDocument({ url: batchResult.pdfUrl });
          const pdfDoc = await loadingTask.promise;
          if (isCancelled) return;

          const targetPageNum = Math.min(selectedPairIndex + 1, pdfDoc.numPages);
          const page = await pdfDoc.getPage(targetPageNum);
          if (isCancelled) return;

          const scale = 1.3 * zoomLevel;
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            activeRenderTaskRef.current = page.render({
              canvasContext: ctx,
              viewport,
              canvas,
            } as any);
            await activeRenderTaskRef.current.promise;
          }
        } else if (originalPdfBytes && activePair) {
          // Render from original source PDF using dynamic page numbers (not parity!)
          const loadingTask = pdfjsLib.getDocument({ data: originalPdfBytes.slice() });
          const pdfDoc = await loadingTask.promise;
          if (isCancelled) return;

          let targetPageNum = activePair.labelPageNumber;
          if (viewMode === 'source-invoice') {
            const invoicePages = activePair.invoicePageNumbers;
            const subIdx = Math.min(selectedInvoiceSubPageIndex, invoicePages.length - 1);
            targetPageNum = invoicePages[subIdx] || invoicePages[0];
          }

          if (targetPageNum > pdfDoc.numPages) {
            targetPageNum = pdfDoc.numPages;
          }

          const page = await pdfDoc.getPage(targetPageNum);
          if (isCancelled) return;

          const scale = 1.0 * zoomLevel;
          const viewport = page.getViewport({ scale });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            activeRenderTaskRef.current = page.render({
              canvasContext: ctx,
              viewport,
              canvas,
            } as any);
            await activeRenderTaskRef.current.promise;
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Preview canvas render notice:', err);
        }
      }
    };

    renderPreviewCanvas();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [batchResult, originalPdfBytes, selectedPairIndex, viewMode, selectedInvoiceSubPageIndex, zoomLevel]);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb / Marketplace Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline text-xs text-white/40">Switch Tool:</span>
          <button
            onClick={() => onNavigate('flipkart-label-crop')}
            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center space-x-1 transition-colors"
          >
            <Crop className="w-3 h-3" />
            <span>Flipkart Label Crop</span>
          </button>
          <button
            onClick={() => onNavigate('meesho-promotional-label')}
            className="px-2.5 py-1 rounded-lg bg-[#c9a57b]/10 hover:bg-[#c9a57b]/20 text-[#c9a57b] border border-[#c9a57b]/20 text-xs font-medium flex items-center space-x-1 transition-colors"
          >
            <Store className="w-3 h-3" />
            <span>Meesho Promotional Label</span>
          </button>
        </div>
      </div>

      {/* Tool Header Card */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Amazon Label Processor
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-amber-400" />
                  <span>Production Ready</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Preserves original Amazon label and adds SKU / Quantity from invoice.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white/70 flex items-center space-x-1.5">
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Original label preserved • SKU/Quantity added from invoice</span>
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex items-start space-x-3 text-red-400 text-xs sm:text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <div className="space-y-1">
            <div className="font-semibold text-red-300">Validation Notice</div>
            <p className="text-red-400/90 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Hidden File Input (always mounted in DOM for initial upload & "Upload New") */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload Dropzone Section */}
      {!batchResult && !isProcessing && (
        <div className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-white/10 hover:border-amber-500/50 bg-[#121212]/70 hover:bg-[#141414] transition-all rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 cursor-pointer group shadow-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h2 className="text-lg font-bold text-white">Upload Amazon Order PDF</h2>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Drag and drop your Amazon PDF with Shipping Labels and Tax Invoices.
              </p>
            </div>
            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs flex items-center space-x-2 transition-colors shadow-lg shadow-amber-500/20"
              >
                <FileText className="w-4 h-4" />
                <span>Select PDF File</span>
              </button>
            </div>
            <div className="text-[11px] text-white/40 pt-2">
              Dynamic document scanning • Multi-page invoice support • Invoices excluded from output
            </div>
          </div>
        </div>
      )}

      {/* Processing Progress Indicator */}
      {isProcessing && (
        <div className="bg-[#141414] border border-white/10 rounded-3xl p-10 text-center space-y-5 shadow-2xl animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">Processing Amazon Labels</h2>
            <p className="text-xs text-white/60">{progressMessage || 'Scanning document sequence...'}</p>
          </div>
        </div>
      )}

      {/* Processed Results & Live Preview Section */}
      {batchResult && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Batch Summary & Orders Selector (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. UPLOAD NEW PDF CARD */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#121212] border border-dashed border-white/15 hover:border-amber-500/40 rounded-2xl p-6 text-center transition-all cursor-pointer group shadow-sm flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Upload New PDF</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Upload another Amazon label PDF
                </p>
              </div>
              <span className="mt-1 px-4 py-2 bg-amber-500/15 group-hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New PDF</span>
              </span>
            </div>

            {/* 2. PROCESSED BATCH SUMMARY CARD */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="pb-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Processed Batch Summary</h3>
                <p className="text-[11px] text-white/40 truncate max-w-full mt-0.5">
                  {batchResult.fileName}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="bg-[#161616] p-2 sm:p-3 rounded-xl border border-white/5 text-center min-w-0">
                  <div className="text-sm sm:text-base font-bold text-white">{batchResult.totalPages}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tight sm:tracking-wider mt-0.5 truncate">Source Pages</div>
                </div>
                <div className="bg-[#161616] p-2 sm:p-3 rounded-xl border border-white/5 text-center min-w-0">
                  <div className="text-sm sm:text-base font-bold text-amber-400">{batchResult.totalOrders}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tight sm:tracking-wider mt-0.5 truncate">Orders Paired</div>
                </div>
                <div className="bg-[#161616] p-2 sm:p-3 rounded-xl border border-white/5 text-center min-w-0">
                  <div className="text-sm sm:text-base font-bold text-emerald-400">{batchResult.successCount}</div>
                  <div className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-tight sm:tracking-wider mt-0.5 truncate">Ready</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handleDirectPrint}
                  className="py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#222222] text-white border border-white/10 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Directly</span>
                </button>
              </div>
            </div>

            {/* Extracted Orders Selector */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Detected Orders ({batchResult.pairResults.length})
                  </h4>
                </div>
                <span className="text-[10px] text-white/40">Select order to preview</span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {batchResult.pairResults.map((pair, idx) => {
                  const isSelected = idx === selectedPairIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedPairIndex(idx);
                        setSelectedInvoiceSubPageIndex(0);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                          : 'bg-[#141414] hover:bg-[#181818] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-amber-500 text-black'
                                : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            Label P{pair.labelPageNumber} ↔ {pair.invoicePageRangeLabel}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            pair.status === 'ready'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                              : 'bg-red-500/10 text-red-300 border-red-500/25'
                          }`}
                        >
                          {pair.status === 'ready' ? 'Ready' : 'Check'}
                        </span>
                      </div>

                      {/* Extracted SKU & Quantity Card */}
                      <div className="bg-black/40 rounded-lg p-2.5 flex items-start justify-between gap-3 text-xs min-w-0">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <span className="text-[10px] text-white/40 block">Inserted Text:</span>
                          <span className="font-mono font-bold text-amber-300 text-xs break-words block">
                            {pair.invoiceData.formattedText || 'Failed to extract'}
                          </span>
                        </div>

                        <div className="text-right space-y-0.5 flex-shrink-0">
                          <span className="text-[10px] text-white/40 block">Qty:</span>
                          <span className="font-semibold text-white">
                            {pair.invoiceData.quantity || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Label Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Preview Toolbar */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
              {/* View Mode Switcher */}
              <div className="flex flex-wrap items-center gap-1 bg-[#161616] p-1 rounded-xl border border-white/5 text-xs max-w-full">
                <button
                  onClick={() => setViewMode('processed')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    viewMode === 'processed'
                      ? 'bg-amber-500 text-black font-semibold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Processed Label
                </button>
                <button
                  onClick={() => setViewMode('source-label')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    viewMode === 'source-label'
                      ? 'bg-white/10 text-white font-semibold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Source Label (P{activePair?.labelPageNumber})
                </button>
                <button
                  onClick={() => setViewMode('source-invoice')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                    viewMode === 'source-invoice'
                      ? 'bg-white/10 text-white font-semibold shadow'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Source Invoice ({activePair?.invoicePageRangeLabel || 'Invoice'})
                </button>
              </div>

              {/* Navigation & Zoom */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <button
                    disabled={selectedPairIndex <= 0}
                    onClick={() => {
                      setSelectedPairIndex((prev) => Math.max(0, prev - 1));
                      setSelectedInvoiceSubPageIndex(0);
                    }}
                    className="p-1.5 rounded-lg bg-[#161616] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                    title="Previous Order"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-white/70 font-mono px-2">
                    {selectedPairIndex + 1} / {batchResult.pairResults.length}
                  </span>
                  <button
                    disabled={selectedPairIndex >= batchResult.pairResults.length - 1}
                    onClick={() => {
                      setSelectedPairIndex((prev) =>
                        Math.min(batchResult.pairResults.length - 1, prev + 1)
                      );
                      setSelectedInvoiceSubPageIndex(0);
                    }}
                    className="p-1.5 rounded-lg bg-[#161616] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
                    title="Next Order"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                    className="p-1.5 rounded-lg bg-[#161616] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] text-white/50 font-mono w-10 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                    className="p-1.5 rounded-lg bg-[#161616] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-page selector if invoice has multiple pages */}
            {viewMode === 'source-invoice' && activePair && activePair.invoicePageNumbers.length > 1 && (
              <div className="bg-[#121212] border border-white/5 rounded-xl p-2 flex items-center justify-between text-xs">
                <span className="text-white/50">Multi-page invoice:</span>
                <div className="flex items-center space-x-1.5">
                  {activePair.invoicePageNumbers.map((pNum, subIdx) => (
                    <button
                      key={pNum}
                      onClick={() => setSelectedInvoiceSubPageIndex(subIdx)}
                      className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors ${
                        selectedInvoiceSubPageIndex === subIdx
                          ? 'bg-amber-500 text-black font-semibold'
                          : 'bg-[#1a1a1a] text-white/70 hover:text-white'
                      }`}
                    >
                      Page {pNum}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas Preview Container */}
            <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl p-3 sm:p-4 min-h-[300px] sm:min-h-[440px] max-h-[560px] flex flex-col items-center justify-center relative overflow-auto shadow-inner max-w-full">
              {/* Overlay Indicator if in processed mode */}
              {viewMode === 'processed' && activePair && (
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 bg-black/80 backdrop-blur-md border border-amber-500/30 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs flex items-center space-x-2 text-white shadow-lg max-w-[calc(100%-1.5rem)] truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <span className="text-white/60 flex-shrink-0">Inserted:</span>
                  <span className="font-mono font-bold text-amber-300 truncate">
                    {activePair.invoiceData.formattedText}
                  </span>
                </div>
              )}

              {/* Live Canvas Element */}
              <div className="p-2 sm:p-3 bg-white shadow-2xl rounded-lg border border-black/10 max-w-full overflow-auto">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full h-auto block transition-all"
                />
              </div>

              {/* Bottom Information Strip */}
              {activePair && (
                <div className="mt-3 text-center text-xs text-white/40 break-words px-2 max-w-full">
                  {viewMode === 'processed'
                    ? `Output dimensions: ${activePair.originalWidth.toFixed(0)} × ${activePair.originalHeight.toFixed(0)} pt (Original Amazon Page Size)`
                    : viewMode === 'source-label'
                    ? `Source Shipping Label Page ${activePair.labelPageNumber}`
                    : `Source Tax Invoice ${activePair.invoicePageRangeLabel}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
