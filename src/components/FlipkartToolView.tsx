import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Crop,
  ArrowLeft,
  UploadCloud,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  MessageSquare,
  Store,
  Check,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { AppRoute } from '../utils/router';
import {
  FlipkartCropResult,
  FlipkartCropSettings,
  FlipkartBatchResult,
  FlipkartCropBox,
  FlipkartActiveCrop,
} from '../types';
import {
  getFlipkartSettings,
  saveFlipkartSettings,
  DEFAULT_FLIPKART_SETTINGS,
  STANDARD_FLIPKART_CROP,
  FLIPKART_DEFAULT_MESSAGES,
} from '../utils/flipkartStorage';
import {
  analyzeFlipkartPage,
  buildFlipkartCroppedPDF,
  getActiveFlipkartMessage,
} from '../utils/flipkartEngine';
import { generateSampleFlipkartPDF } from '../utils/sampleFlipkartGenerator';

interface FlipkartToolViewProps {
  onNavigate: (route: AppRoute) => void;
  onOpenHelpModal: () => void;
}

const PRESET_MESSAGES = FLIPKART_DEFAULT_MESSAGES;

export const FlipkartToolView: React.FC<FlipkartToolViewProps> = ({ onNavigate }) => {
  // Settings state
  const [settings, setSettings] = useState<FlipkartCropSettings>(getFlipkartSettings);

  // File & Batch state
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [pageResults, setPageResults] = useState<FlipkartCropResult[]>([]);

  // Processing state
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [batchResult, setBatchResult] = useState<FlipkartBatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview display state
  const [viewMode, setViewMode] = useState<'cropped' | 'original'>('cropped');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Refs for rendering preview canvases
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRenderTaskRef = useRef<any>(null);

  // Advanced Crop Mode and coordinates state (PDF points)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [pageCrops, setPageCrops] = useState<FlipkartActiveCrop[]>([]);
  const [activeCropBox, setActiveCropBox] = useState<FlipkartCropBox>(() => {
    return settings.customCrop || { ...STANDARD_FLIPKART_CROP };
  });
  const [isProcessingCrop, setIsProcessingCrop] = useState<boolean>(false);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [cropAppliedToast, setCropAppliedToast] = useState<boolean>(false);

  // Drag and drop upload state & refs
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Prevent browser default behavior of opening dropped PDFs anywhere on the window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Compute if the user has modified coordinates that haven't been applied & processed yet (Test 4 & Section 17)
  const hasUnprocessedChanges = useMemo(() => {
    const saved = pageCrops[currentPageIndex];
    if (!saved) return false;
    return (
      Math.abs(activeCropBox.x - saved.x) > 0.5 ||
      Math.abs(activeCropBox.y - saved.y) > 0.5 ||
      Math.abs(activeCropBox.width - saved.width) > 0.5 ||
      Math.abs(activeCropBox.height - saved.height) > 0.5
    );
  }, [activeCropBox, pageCrops, currentPageIndex]);

  // Section 17 Processing State Tracker
  const currentPageCropState = useMemo(() => {
    if (isProcessingCrop || isProcessingBatch) {
      return {
        label: 'Processing Live',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      };
    }
    if (hasUnprocessedChanges) {
      return {
        label: 'CROP CHANGED — REPROCESS REQUIRED',
        color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      };
    }
    const crop = pageCrops[currentPageIndex];
    if (crop && (crop.source === 'manual' || crop.source === 'advanced')) {
      return {
        label: 'MANUAL CROP APPLIED',
        color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
      };
    }
    return {
      label: 'AUTO DETECTED',
      color: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    };
  }, [isProcessingCrop, isProcessingBatch, hasUnprocessedChanges, pageCrops, currentPageIndex]);

  // Keep activeCropBox synchronized when page changes or initial crops load
  useEffect(() => {
    if (pageCrops[currentPageIndex]) {
      setActiveCropBox({
        x: pageCrops[currentPageIndex].x,
        y: pageCrops[currentPageIndex].y,
        width: pageCrops[currentPageIndex].width,
        height: pageCrops[currentPageIndex].height,
      });
    } else if (pageResults[currentPageIndex]?.cropBounds) {
      setActiveCropBox(pageResults[currentPageIndex].cropBounds);
    } else {
      setActiveCropBox({ ...STANDARD_FLIPKART_CROP });
    }
  }, [currentPageIndex, pageCrops.length]);

  // Drag and Resize handler for the interactive visual crop rectangle on Original Page
  const startDrag = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialBox = { ...activeCropBox };
    const curWidth = pageResults[currentPageIndex]?.originalWidth || 595.28;
    const curHeight = pageResults[currentPageIndex]?.originalHeight || 841.89;
    const canvasEl = originalCanvasRef.current;
    const clientW = canvasEl ? canvasEl.clientWidth : 0;
    const scale = clientW > 0 ? clientW / curWidth : (canvasDimensions.width > 0 ? canvasDimensions.width / curWidth : 1);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaScreenX = moveEvent.clientX - startX;
      const deltaScreenY = moveEvent.clientY - startY;
      const deltaPdfX = deltaScreenX / scale;
      const deltaPdfY = deltaScreenY / scale;

      let newX = initialBox.x;
      let newY = initialBox.y;
      let newW = initialBox.width;
      let newH = initialBox.height;

      const MIN_SIZE = 40;

      if (handle === 'move') {
        newX = Math.max(0, Math.min(curWidth - newW, initialBox.x + deltaPdfX));
        newY = Math.max(0, Math.min(curHeight - newH, initialBox.y + deltaPdfY));
      } else {
        if (handle.includes('w')) {
          const proposedX = initialBox.x + deltaPdfX;
          const maxLeft = initialBox.x + initialBox.width - MIN_SIZE;
          newX = Math.max(0, Math.min(maxLeft, proposedX));
          newW = initialBox.width - (newX - initialBox.x);
        }
        if (handle.includes('e')) {
          const proposedW = initialBox.width + deltaPdfX;
          newW = Math.max(MIN_SIZE, Math.min(curWidth - initialBox.x, proposedW));
        }
        if (handle.includes('n')) {
          const proposedY = initialBox.y + deltaPdfY;
          const maxTop = initialBox.y + initialBox.height - MIN_SIZE;
          newY = Math.max(0, Math.min(maxTop, proposedY));
          newH = initialBox.height - (newY - initialBox.y);
        }
        if (handle.includes('s')) {
          const proposedH = initialBox.height + deltaPdfY;
          newH = Math.max(MIN_SIZE, Math.min(curHeight - initialBox.y, proposedH));
        }
      }

      setActiveCropBox({
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Apply manual crop for the current page and immediately process (Section 9, 17 & Test 10)
  const handleApplyCrop = async (): Promise<FlipkartBatchResult | null> => {
    if (!originalPdfBytes) return null;
    setIsProcessingCrop(true);
    setErrorMessage(null);
    setBatchResult(null);

    // Yield control so React paints the processing indicator immediately
    await new Promise((r) => setTimeout(r, 0));

    try {
      const updatedCrops = [...pageCrops];
      const newActiveCrop: FlipkartActiveCrop = {
        pageIndex: currentPageIndex,
        pageNumber: currentPageIndex + 1,
        x: Math.round(activeCropBox.x * 10) / 10,
        y: Math.round(activeCropBox.y * 10) / 10,
        width: Math.round(activeCropBox.width * 10) / 10,
        height: Math.round(activeCropBox.height * 10) / 10,
        source: 'manual',
        processed: true,
      };
      updatedCrops[currentPageIndex] = newActiveCrop;
      setPageCrops(updatedCrops);

      const pageCustoms = { ...(settings.pageCustomCrops || {}) };
      pageCustoms[currentPageIndex] = {
        x: newActiveCrop.x,
        y: newActiveCrop.y,
        width: newActiveCrop.width,
        height: newActiveCrop.height,
      };

      const updatedSettings: FlipkartCropSettings = {
        ...settings,
        cropMode: 'advanced',
        customCrop: {
          x: newActiveCrop.x,
          y: newActiveCrop.y,
          width: newActiveCrop.width,
          height: newActiveCrop.height,
        },
        pageCustomCrops: pageCustoms,
      };
      setSettings(updatedSettings);
      saveFlipkartSettings(updatedSettings);

      // Re-run batch crop with authoritative crops
      const result = await runBatchCrop(originalPdfBytes, updatedCrops, updatedSettings, totalPages, fileName);

      // Update pageResults for current page
      setPageResults((prev) => {
        const next = [...prev];
        if (next[currentPageIndex]) {
          next[currentPageIndex] = {
            ...next[currentPageIndex],
            cropBounds: {
              x: newActiveCrop.x,
              y: newActiveCrop.y,
              width: newActiveCrop.width,
              height: newActiveCrop.height,
            },
            status: 'ready',
            statusMessage: 'Manual crop applied.',
          };
        }
        return next;
      });

      setCropAppliedToast(true);
      setTimeout(() => setCropAppliedToast(false), 3000);
      setViewMode('cropped');
      return result;
    } catch (err: any) {
      console.error('Error applying crop:', err);
      setErrorMessage('Failed to apply crop: ' + (err?.message || 'Unknown error'));
      return null;
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // Reset to auto-crop for the current page (Test 5 & Section 17)
  const handleResetStandardCrop = async () => {
    if (!originalPdfBytes) return;
    setIsProcessingCrop(true);
    setErrorMessage(null);
    setBatchResult(null);

    await new Promise((r) => setTimeout(r, 0));

    try {
      const loadingTask = pdfjsLib.getDocument({ data: originalPdfBytes.slice() });
      const pdfJsDoc = await loadingTask.promise;
      const pdfJsPage = await pdfJsDoc.getPage(currentPageIndex + 1);

      const pageCustoms = { ...(settings.pageCustomCrops || {}) };
      delete pageCustoms[currentPageIndex];

      const cleanSettings: FlipkartCropSettings = {
        ...settings,
        cropMode: Object.keys(pageCustoms).length > 0 ? 'advanced' : 'standard',
        pageCustomCrops: pageCustoms,
      };

      // Run clean auto-detection without manual crop override
      const autoRes = await analyzeFlipkartPage(pdfJsPage, currentPageIndex, cleanSettings, undefined);
      const autoCropBox: FlipkartCropBox = {
        x: autoRes.cropBounds.x,
        y: autoRes.cropBounds.y,
        width: autoRes.cropBounds.width,
        height: autoRes.cropBounds.height,
      };

      setActiveCropBox(autoCropBox);

      const updatedCrops = [...pageCrops];
      updatedCrops[currentPageIndex] = {
        pageIndex: currentPageIndex,
        pageNumber: currentPageIndex + 1,
        ...autoCropBox,
        source: 'auto',
        processed: true,
      };
      setPageCrops(updatedCrops);

      setSettings(cleanSettings);
      saveFlipkartSettings(cleanSettings);

      await runBatchCrop(originalPdfBytes, updatedCrops, cleanSettings, totalPages, fileName);

      setPageResults((prev) => {
        const next = [...prev];
        if (next[currentPageIndex]) {
          next[currentPageIndex] = autoRes;
        }
        return next;
      });

      setCropAppliedToast(true);
      setTimeout(() => setCropAppliedToast(false), 3000);
      setViewMode('cropped');
    } catch (err: any) {
      console.error('Error resetting crop:', err);
    } finally {
      setIsProcessingCrop(false);
    }
  };

  // Save settings whenever changed
  const updateSettings = (partial: Partial<FlipkartCropSettings>) => {
    const updated: FlipkartCropSettings = {
      ...settings,
      ...partial,
      messageMode: partial.messageMode ?? settings.messageMode ?? 'default',
      defaultMessage: partial.defaultMessage ?? settings.defaultMessage ?? DEFAULT_FLIPKART_SETTINGS.defaultMessage,
      customMessage: partial.customMessage ?? settings.customMessage ?? DEFAULT_FLIPKART_SETTINGS.customMessage,
    };
    setSettings(updated);
    saveFlipkartSettings(updated);

    // If PDF is loaded, re-crop with new settings using existing page crops
    if (originalPdfBytes && pageCrops.length > 0) {
      runBatchCrop(originalPdfBytes, pageCrops, updated, totalPages, fileName);
    }
  };

  // Load a file from array buffer
  const loadPdfData = async (data: Uint8Array, name: string) => {
    setErrorMessage(null);
    setBatchResult(null);
    setFileName(name);
    setOriginalPdfBytes(data);
    setCurrentPageIndex(0);

    // Immediately enter processing state with ZERO delay
    setIsProcessingBatch(true);
    setProgressCurrent(0);
    setProgressTotal(1);

    // Yield control so React paints the processing indicator immediately
    await new Promise((resolve) => setTimeout(resolve, 10));

    try {
      const loadingTask = pdfjsLib.getDocument({ data: data.slice() });
      const pdfJsDoc = await loadingTask.promise;
      const pagesCount = pdfJsDoc.numPages;
      setTotalPages(pagesCount);
      setProgressTotal(pagesCount);
      setProgressCurrent(1);

      // Clean start for fresh document: reset per-page overrides so every new file gets independent auto-detection
      const docSettings: FlipkartCropSettings = {
        ...settings,
        pageCustomCrops: {},
        cropMode: 'standard',
      };
      setSettings(docSettings);
      saveFlipkartSettings(docSettings);

      // Analyze pages
      const results: FlipkartCropResult[] = [];
      const initialCrops: FlipkartActiveCrop[] = [];

      for (let i = 1; i <= pagesCount; i++) {
        const page = await pdfJsDoc.getPage(i);
        const res = await analyzeFlipkartPage(page, i - 1, docSettings, undefined);
        results.push(res);
        initialCrops.push({
          pageIndex: i - 1,
          pageNumber: i,
          x: res.cropBounds.x,
          y: res.cropBounds.y,
          width: res.cropBounds.width,
          height: res.cropBounds.height,
          source: 'auto',
          processed: true,
        });

        // Periodic yield for large PDFs to ensure UI thread remains smooth
        if (i % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      setPageResults(results);
      setPageCrops(initialCrops);
      if (initialCrops.length > 0) {
        setActiveCropBox({
          x: initialCrops[0].x,
          y: initialCrops[0].y,
          width: initialCrops[0].width,
          height: initialCrops[0].height,
        });
      }

      // Auto-generate cropped PDF batch for instant preview and download
      await runBatchCrop(data, initialCrops, docSettings, pagesCount, name);
    } catch (err: any) {
      console.error('Error loading Flipkart PDF:', err);
      setErrorMessage(
        err?.message || 'Failed to read the PDF file. Please ensure it is a valid Flipkart order PDF.'
      );
      setBatchResult(null);
      setProgressCurrent(0);
      setProgressTotal(0);
      setIsProcessingBatch(false);
    }
  };

  // Run the batch crop engine
  const runBatchCrop = async (
    bytes: Uint8Array,
    crops: FlipkartActiveCrop[],
    currentSettings: FlipkartCropSettings,
    total: number,
    _baseName: string
  ): Promise<FlipkartBatchResult | null> => {
    setIsProcessingBatch(true);
    setProgressCurrent(0);
    setProgressTotal(total);
    setErrorMessage(null);

    // Yield control so React paints the processing indicator IMMEDIATELY
    await new Promise((r) => setTimeout(r, 0));

    let lastProgressTime = 0;

    try {
      if (batchResult?.pdfUrl) {
        URL.revokeObjectURL(batchResult.pdfUrl);
      }
      setBatchResult(null);

      const result = await buildFlipkartCroppedPDF(
        bytes,
        currentSettings,
        crops,
        (current, tot) => {
          const now = Date.now();
          // Efficient progress dispatch: update on first/last, or every ~80ms to avoid UI render choking
          if (current === 1 || current === tot || now - lastProgressTime >= 80) {
            lastProgressTime = now;
            setProgressCurrent(current);
            setProgressTotal(tot);
          }
        }
      );

      // Ensure final progress state is 100%
      setProgressCurrent(total);
      setProgressTotal(total);
      setBatchResult(result);
      return result;
    } catch (err: any) {
      console.error('Batch crop error:', err);
      setErrorMessage(
        'Unable to complete label cropping: ' + (err?.message || 'Unknown processing error.')
      );
      setBatchResult(null);
      setProgressCurrent(0);
      setProgressTotal(0);
      return null;
    } finally {
      setIsProcessingBatch(false);
    }
  };

  // Unified file processing handler for both Choose File and Drag & Drop
  const processSelectedFile = (file: File) => {
    if (!file) return;

    // Validate that the file is a PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (e.g. Flipkart order labels PDF).');
      return;
    }

    // Immediately trigger processing state before reading the file
    setIsProcessingBatch(true);
    setProgressCurrent(0);
    setProgressTotal(0);
    setErrorMessage(null);
    setBatchResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      setTimeout(() => {
        loadPdfData(new Uint8Array(buffer), file.name);
      }, 0);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the file. Please try again.');
      setIsProcessingBatch(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    e.target.value = '';
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  // Load sample PDFs for quick verification
  const handleLoadSample = async (
    variation: 'standard' | 'compact' | 'multi' | 'long-address' | 'short-address'
  ) => {
    const count = variation === 'multi' ? 6 : 1;
    const names = {
      standard: 'sample_flipkart_invoice_labels_standard.pdf',
      compact: 'sample_flipkart_compact_with_large_invoice.pdf',
      multi: 'invoice_labels_batch_6pages.pdf',
      'long-address': 'sample_flipkart_long_address_label.pdf',
      'short-address': 'sample_flipkart_short_address_label.pdf',
    };

    // Immediately trigger processing state
    setIsProcessingBatch(true);
    setProgressCurrent(0);
    setProgressTotal(0);
    setErrorMessage(null);
    setBatchResult(null);

    await new Promise((r) => setTimeout(r, 0));
    const sampleBytes = await generateSampleFlipkartPDF(count, variation);
    await loadPdfData(sampleBytes, names[variation]);
  };

  // Trigger browser print of the cropped PDF
  const handlePrint = () => {
    if (!batchResult) return;
    const printWindow = window.open(batchResult.pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  // Canvas rendering effect for PDF page preview
  useEffect(() => {
    let isCancelled = false;

    // Do NOT render preview canvas while batch processing or crop processing is actively running!
    if (isProcessingBatch || isProcessingCrop) {
      return;
    }

    const renderPreview = async () => {
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {}
        activeRenderTaskRef.current = null;
      }

      try {
        // Render Original Page Cleanly (without debug bounding boxes)
        if (originalPdfBytes && originalCanvasRef.current && viewMode === 'original') {
          const loadingTaskOrig = pdfjsLib.getDocument({ data: originalPdfBytes.slice() });
          const origPdf = await loadingTaskOrig.promise;
          if (isCancelled) return;
          const origPage = await origPdf.getPage(currentPageIndex + 1);
          if (isCancelled) return;

          // 12-14% smaller scale for balanced preview footprint
          const scale = 0.83 * zoomLevel;
          const viewport = origPage.getViewport({ scale });
          const canvas = originalCanvasRef.current;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await (origPage.render({ canvasContext: ctx, viewport, canvas } as any)).promise;
            if (!isCancelled) {
              setCanvasDimensions({ width: viewport.width, height: viewport.height });
            }
          }
        }

        // Render Cropped Output Page Cleanly
        if (batchResult && previewCanvasRef.current && viewMode === 'cropped') {
          const loadingTaskCropped = pdfjsLib.getDocument({ url: batchResult.pdfUrl });
          const croppedPdf = await loadingTaskCropped.promise;
          if (isCancelled) return;
          const safePageNum = Math.min(currentPageIndex + 1, croppedPdf.numPages);
          const croppedPage = await croppedPdf.getPage(safePageNum);
          if (isCancelled) return;

          // 12-14% smaller scale for balanced preview footprint
          const scale = 1.32 * zoomLevel;
          const viewport = croppedPage.getViewport({ scale });
          const canvas = previewCanvasRef.current;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            activeRenderTaskRef.current = croppedPage.render({ canvasContext: ctx, viewport, canvas } as any);
            await activeRenderTaskRef.current.promise;
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('Preview rendering notice:', err);
        }
      }
    };

    renderPreview();

    return () => {
      isCancelled = true;
      if (activeRenderTaskRef.current) {
        try {
          activeRenderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [batchResult, currentPageIndex, viewMode, zoomLevel, originalPdfBytes, isProcessingBatch, isProcessingCrop]);

  const activeMessage = getActiveFlipkartMessage(settings);

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center space-x-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tools</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline text-xs text-white/40">Other Marketplaces:</span>
          <button
            onClick={() => onNavigate('meesho-promotional-label')}
            className="px-2.5 py-1 rounded-lg bg-[#c9a57b]/10 hover:bg-[#c9a57b]/20 text-[#c9a57b] border border-[#c9a57b]/20 text-xs font-medium flex items-center space-x-1 transition-colors"
          >
            <Store className="w-3 h-3" />
            <span>Meesho Promotional Label</span>
          </button>
        </div>
      </div>

      {/* Main Tool Header Card */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Crop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Flipkart Label Crop
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  Dedicated Module
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50 mt-1">
                Crop your Flipkart shipping labels and prepare them for printing.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white/70 flex items-center space-x-1.5">
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Standard 4×6" Thermal Ready</span>
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-400 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-red-300/80 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Settings & Upload) / Right Column (Live Preview & Batch Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Upload & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Upload Dropzone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-[#121212] border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                : 'border-white/15 hover:border-blue-500/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              id="flipkart-pdf-input"
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={handleFileChange}
            />
            <label
              htmlFor="flipkart-pdf-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2.5"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isDragging
                    ? 'bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/30'
                    : 'bg-blue-500/10 text-blue-400'
                }`}
              >
                <UploadCloud className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {isDragging
                    ? 'Drop PDF here'
                    : fileName
                    ? fileName
                    : 'Upload Flipkart PDF'}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {isDragging
                    ? 'Release to upload and crop shipping labels'
                    : 'Drag & drop original Flipkart download (e.g. invoice_labels_*.pdf)'}
                </p>
              </div>
              <span
                className={`mt-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isDragging
                    ? 'bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/30'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30'
                }`}
              >
                {isDragging ? 'Drop to Upload' : fileName ? 'Choose Another PDF' : 'Select PDF File'}
              </span>
            </label>

            {fileName && totalPages > 0 && (
              <div className="mt-4 space-y-2.5">
                <div className="p-3 bg-[#181818] border border-blue-500/20 rounded-xl text-left flex items-center justify-between text-xs gap-2 min-w-0">
                  <div className="flex items-center space-x-2 truncate min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-white font-medium truncate">{fileName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold flex-shrink-0 whitespace-nowrap">
                    {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (originalPdfBytes) {
                      runBatchCrop(originalPdfBytes, pageCrops, settings, totalPages, fileName);
                    }
                  }}
                  disabled={isProcessingBatch || isProcessingCrop}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingBatch || isProcessingCrop ? 'animate-spin' : ''}`} />
                  <span>{isProcessingBatch || isProcessingCrop ? 'Processing Labels...' : 'Process / Generate PDF'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Step 2: One-Line Message Configuration */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>One-Line Customer Message</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableMessage}
                  onChange={(e) => updateSettings({ enableMessage: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              Appended cleanly below the complete cropped Flipkart label. Scaled automatically so it
              never overflows, never wraps, and never touches the shipping barcode.
            </p>

            {settings.enableMessage && (
              <div className="space-y-3 pt-1">
                {/* Mode Selector: [ Default Message ] or [ Custom Message ] */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => updateSettings({ messageMode: 'default' })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      settings.messageMode === 'default'
                        ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-sm'
                        : 'bg-[#181818] border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    Default Message
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ messageMode: 'custom' })}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      settings.messageMode === 'custom'
                        ? 'bg-blue-600 text-white font-semibold border-blue-500 shadow-sm'
                        : 'bg-[#181818] border-white/5 text-white/60 hover:text-white'
                    }`}
                  >
                    Custom Message
                  </button>
                </div>

                {/* Content for Default Message Mode */}
                {settings.messageMode === 'default' ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-white/60 mb-1">
                      Select Message:
                    </label>
                    <div className="space-y-1.5">
                      {FLIPKART_DEFAULT_MESSAGES.map((msg, index) => {
                        const isSelected = (settings.defaultMessage || FLIPKART_DEFAULT_MESSAGES[0]) === msg;
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => updateSettings({ defaultMessage: msg })}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-start space-x-2.5 ${
                              isSelected
                                ? 'bg-blue-600/15 border-blue-500/50 text-white font-medium shadow-sm'
                                : 'bg-[#181818] border-white/5 text-white/70 hover:text-white hover:border-white/15'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-blue-500 bg-blue-600' : 'border-white/20 bg-transparent'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="leading-snug">{msg}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Content for Custom Message Mode */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-white/60 mb-1.5">
                        Your Custom Message (Single Line)
                      </label>
                      <input
                        type="text"
                        value={settings.customMessage}
                        onChange={(e) => updateSettings({ customMessage: e.target.value })}
                        placeholder={FLIPKART_DEFAULT_MESSAGES[0]}
                        className="w-full px-3 py-2 bg-[#181818] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <span className="block text-[10px] text-white/40 mb-1.5 uppercase font-medium">
                        Quick Presets:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {FLIPKART_DEFAULT_MESSAGES.map((msg) => (
                          <button
                            key={msg}
                            type="button"
                            onClick={() => updateSettings({ customMessage: msg })}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-colors ${
                              settings.customMessage === msg
                                ? 'bg-blue-600 text-white font-medium'
                                : 'bg-[#181818] text-white/60 hover:text-white border border-white/5 hover:border-white/20'
                            }`}
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Output Option (Section 7: Single Option) */}
            <div className="pt-3 border-t border-white/5">
              <label className="block text-[11px] font-medium text-white/60 mb-2 uppercase tracking-wider">
                Output
              </label>
              <div className="p-3.5 rounded-xl bg-[#181818] border border-blue-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Printer className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Exact Crop PDF</div>
                    <div className="text-[11px] text-white/50 mt-0.5">
                      (Tight shipping label)
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-semibold">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Preview & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Action Toolbar */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setViewMode('cropped')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'cropped'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Cropped Label
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Original Page
              </button>
            </div>

            {/* Crop Processing State Badge (Section 17) */}
            {!isProcessingBatch && !isProcessingCrop && (
              <div className="flex items-center">
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center space-x-1.5 ${currentPageCropState.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{currentPageCropState.label}</span>
                </span>
              </div>
            )}

            {/* Page Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2 text-xs">
                <button
                  onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentPageIndex === 0}
                  className="p-1.5 rounded-lg bg-[#181818] hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/80 font-medium">
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPageIndex >= totalPages - 1}
                  className="p-1.5 rounded-lg bg-[#181818] hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1.5 text-xs text-white/60">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 rounded-lg bg-[#181818] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-[11px]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.1))}
                className="p-1.5 rounded-lg bg-[#181818] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="p-1.5 rounded-lg bg-[#181818] hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Reset Zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Top Processing & Progress Indicator (Moved to top of preview section) */}
          {(isProcessingBatch || isProcessingCrop) && (
            <div className="bg-[#121212] border border-blue-500/30 rounded-2xl p-4 space-y-2 shadow-lg shadow-blue-500/5 transition-all">
              <div className="flex justify-between items-center text-xs text-white">
                <span className="flex items-center space-x-2 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>
                    {isProcessingCrop
                      ? 'Applying crop adjustment...'
                      : 'Cropping Flipkart Shipping Labels...'}
                  </span>
                </span>
                <span className="font-mono text-blue-400 font-semibold">
                  {progressTotal > 0 ? `${progressCurrent} / ${progressTotal}` : 'Preparing...'}
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-150 rounded-full"
                  style={{
                    width: `${
                      progressTotal > 0
                        ? Math.min(100, Math.max(5, (progressCurrent / progressTotal) * 100))
                        : 8
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Detection Status Bar - Page-Specific Validation */}
          {(pageResults[currentPageIndex]?.status === 'warning' ||
            pageResults[currentPageIndex]?.status === 'error') && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">
                  Shipping label position may differ on this page.
                </p>
                <p className="text-amber-200/80 mt-0.5 text-[11px]">
                  {pageResults[currentPageIndex]?.statusMessage ||
                    'The standard boundary may require adjustment for this invoice.'}
                </p>
              </div>
            </div>
          )}

          {/* Unprocessed Changes Notice Banner (Test 4) */}
          {hasUnprocessedChanges && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-3.5 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Unprocessed crop adjustments on Page {currentPageIndex + 1}.</strong> Click &ldquo;Apply &amp; Process Crop&rdquo; to update preview and enable download.
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyCrop}
                disabled={isProcessingCrop || isProcessingBatch}
                className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs flex-shrink-0 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isProcessingCrop ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Apply & Process Crop</span>
              </button>
            </div>
          )}

          {/* Preview Canvas Area (Reduced by 10-15% for balanced layout) */}
          <div className="bg-[#0b0b0b] border border-white/5 rounded-2xl p-3 sm:p-3.5 min-h-[240px] sm:min-h-[320px] max-h-[460px] flex items-center justify-center overflow-auto max-w-full">
            {!originalPdfBytes ? (
              <div className="text-center py-10 space-y-2.5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                  <Crop className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/70">No PDF Loaded</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                    Upload your Flipkart order PDF or click one of the sample buttons to preview.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full">
                {/* Original Page Canvas with interactive visual crop overlay */}
                {viewMode === 'original' && (
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <div
                      className="relative border border-white/10 rounded-lg shadow-2xl overflow-hidden bg-white select-none"
                      style={{
                        width: canvasDimensions.width ? `${canvasDimensions.width}px` : 'auto',
                        height: canvasDimensions.height ? `${canvasDimensions.height}px` : 'auto',
                        maxWidth: '100%',
                      }}
                    >
                      <canvas ref={originalCanvasRef} className="block max-w-full h-auto" />

                      {/* Visual Crop Box Overlay */}
                      {canvasDimensions.width > 0 && (() => {
                        const curWidth = pageResults[currentPageIndex]?.originalWidth || 595.28;
                        const canvasEl = originalCanvasRef.current;
                        const clientW = canvasEl ? canvasEl.clientWidth : 0;
                        const scale = clientW > 0 ? clientW / curWidth : (canvasDimensions.width / curWidth || 1);

                        const boxLeft = activeCropBox.x * scale;
                        const boxTop = activeCropBox.y * scale;
                        const boxW = activeCropBox.width * scale;
                        const boxH = activeCropBox.height * scale;

                        return (
                          <div
                            className="absolute pointer-events-auto border-2 border-emerald-500"
                            style={{
                              left: `${boxLeft}px`,
                              top: `${boxTop}px`,
                              width: `${boxW}px`,
                              height: `${boxH}px`,
                              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.48)',
                              backgroundColor: 'rgba(16, 185, 129, 0.05)',
                              cursor: 'move',
                            }}
                            onPointerDown={(e) => startDrag(e, 'move')}
                            title="Drag to reposition crop area"
                          >
                            {/* Header Label Badge */}
                            <div className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-md whitespace-nowrap shadow flex items-center space-x-1 pointer-events-none">
                              <span>Shipping Label Area</span>
                            </div>

                            {/* 4 Corner Handles */}
                            <div
                              onPointerDown={(e) => startDrag(e, 'nw')}
                              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-sm cursor-nwse-resize shadow-md z-10 hover:scale-125 transition-transform"
                              title="Resize from top-left"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 'ne')}
                              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-sm cursor-nesw-resize shadow-md z-10 hover:scale-125 transition-transform"
                              title="Resize from top-right"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 'sw')}
                              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-sm cursor-nesw-resize shadow-md z-10 hover:scale-125 transition-transform"
                              title="Resize from bottom-left"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 'se')}
                              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-sm cursor-nwse-resize shadow-md z-10 hover:scale-125 transition-transform"
                              title="Resize from bottom-right"
                            />

                            {/* 4 Edge Handles */}
                            <div
                              onPointerDown={(e) => startDrag(e, 'n')}
                              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-500 rounded-full cursor-ns-resize shadow z-10 hover:bg-emerald-400"
                              title="Resize top"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 's')}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-500 rounded-full cursor-ns-resize shadow z-10 hover:bg-emerald-400"
                              title="Resize bottom"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 'w')}
                              className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-6 w-2 bg-emerald-500 rounded-full cursor-ew-resize shadow z-10 hover:bg-emerald-400"
                              title="Resize left"
                            />
                            <div
                              onPointerDown={(e) => startDrag(e, 'e')}
                              className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-6 w-2 bg-emerald-500 rounded-full cursor-ew-resize shadow z-10 hover:bg-emerald-400"
                              title="Resize right"
                            />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Interactive Crop Control Bar */}
                    <div className="w-full max-w-xl bg-[#121212] border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row items-center sm:justify-between gap-2.5 text-xs shadow-lg">
                      <div className="flex items-center space-x-2 text-center sm:text-left">
                        <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] sm:text-[11px] text-white/70 font-mono">
                          X: {Math.round(activeCropBox.x)} · Y: {Math.round(activeCropBox.y)} · W: {Math.round(activeCropBox.width)} · H: {Math.round(activeCropBox.height)} pt
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleResetStandardCrop}
                          disabled={isProcessingCrop || isProcessingBatch}
                          className="flex-1 sm:flex-none px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-xs font-medium border border-white/10 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          title="Reset to standard auto-detection baseline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset to Auto</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApplyCrop}
                          disabled={isProcessingCrop || isProcessingBatch}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                            hasUnprocessedChanges
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                              : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                          }`}
                          title="Apply this manual crop selection and re-process exact crop output"
                        >
                          {isProcessingCrop ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span>Apply &amp; Process Crop</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-white/50 bg-[#121212] px-3 py-1.5 rounded-full border border-white/5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Green box shows the shipping label area to be extracted for printing. Darkened area is invoice content that will be excluded.</span>
                    </div>
                  </div>
                )}

                {/* Cropped Output Canvas */}
                {viewMode === 'cropped' && (
                  <div className="flex flex-col items-center space-y-3 max-w-full">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                      Page Size: (Exact crop geometry)
                    </div>
                    <div className="border-2 border-emerald-500/30 rounded-lg shadow-2xl overflow-hidden bg-white max-w-full">
                      <canvas ref={previewCanvasRef} className="block max-w-full h-auto" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Download & Print Banner - appears ONLY after processing successfully completes */}
          {batchResult && !isProcessingBatch && !isProcessingCrop && !errorMessage && (
            <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
              hasUnprocessedChanges
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-[#121212] border-emerald-500/30'
            }`}>
              <div className="flex items-center space-x-3 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  hasUnprocessedChanges
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {hasUnprocessedChanges ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {hasUnprocessedChanges
                      ? `Crop changes pending for Page ${currentPageIndex + 1}`
                      : `${batchResult.successCount} ${batchResult.successCount === 1 ? 'Label' : 'Labels'} Ready for Printing`}
                  </p>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    {hasUnprocessedChanges
                      ? 'Process crop to update output and enable download.'
                      : settings.enableMessage && activeMessage
                        ? `Message: "${activeMessage}"`
                        : 'Label cropped cleanly'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {hasUnprocessedChanges ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await handleApplyCrop();
                        if (res && res.pdfUrl) {
                          const a = document.createElement('a');
                          a.href = res.pdfUrl;
                          a.download = res.fileName || 'flipkart_labels_cropped.pdf';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                      disabled={isProcessingCrop || isProcessingBatch}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
                      title="Apply new crop and download PDF immediately"
                    >
                      {isProcessingCrop ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={hasUnprocessedChanges || isProcessingBatch || isProcessingCrop}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#181818] hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-40"
                      title={hasUnprocessedChanges ? 'Apply & Process Crop first to print' : 'Print directly'}
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      <span>Print Directly</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={batchResult.pdfUrl}
                      download={batchResult.fileName || 'flipkart_labels_cropped.pdf'}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all text-center"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </a>

                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={isProcessingBatch || isProcessingCrop}
                      className="w-full sm:w-auto px-4 py-2.5 bg-[#181818] hover:bg-white/10 text-white rounded-xl text-xs font-semibold border border-white/10 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-40"
                      title="Print directly"
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      <span>Print Directly</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
