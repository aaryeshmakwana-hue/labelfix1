export interface MeeshoAccount {
  id: string;
  accountName: string;
  storeLink: string;
  generatedQRCode?: string; // Data URL for preview
  qrSettings: {
    size: number;
    errorCorrection: 'L' | 'M' | 'Q' | 'H';
    margin: number;
  };
  messageTemplate: MessageTemplate;
  labelSettings: {
    outputWidth: number; // in points (288 for 4 inches)
    outputHeight: number; // in points (432 for 6 inches)
    bottomMargin: number; // in points
    overlayOffsetTop?: number; // extra vertical offset in pt to position in lower green circle
    maxQRSize: number; // in points
    minimumFontSize: number; // in points
    thermalOptimization: boolean;
    enableEmojis: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  heading: string;
  reviewMessage: string;
  storeCTA: string;
  subCTA: string;
  footer: string;
  enableEmojis: boolean;
}

export interface DetectedElement {
  type: 'text' | 'barcode' | 'qr' | 'table' | 'line' | 'logo';
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelDetectionResult {
  pageIndex: number;
  originalWidth: number;
  originalHeight: number;
  scaleFactor: number;
  labelBounds: { x: number; y: number; width: number; height: number };
  invoiceStartTopY?: number; // Y in 4x6 where TAX INVOICE begins
  invoiceCandidateTopY?: number; // Initial discovery candidate Y
  invoiceEndingY: number; // in 4x6 output coordinate space (verified true invoice ending points from top)
  availableWhitespaceHeight: number; // in points from invoiceEndingY to bottom margin
  detectedElements: DetectedElement[];
  barcodeRegions: { x: number; y: number; width: number; height: number }[];
  detectedSections?: string[]; // e.g. ["TAX INVOICE Header", "Table Columns", "Product Rows", "Grand Total", "Reverse Charge Disclaimer"]
  detectedInvoiceItemsCount?: number;
  verificationPassed?: boolean;
  verificationTrace?: string[]; // Step-by-step verification log
  invoiceEndingReason?: string;
  invoiceDisclaimerRegion?: { x: number; y: number; width: number; height: number };
  safePromotionalRegion?: { x: number; y: number; width: number; height: number };
  expectedPromotionalRegion?: { x: number; y: number; width: number; height: number };
  actualPromotionalRegion?: { x: number; y: number; width: number; height: number };
  isPlacementValid?: boolean;
  placementValidationReason?: string;
  protectedInvoiceRegion?: { x: number; y: number; width: number; height: number };
  protectedLabelRegion?: { x: number; y: number; width: number; height: number };
  detectionChecklist?: { id: string; label: string; detected: boolean; details?: string }[];
  isInvoiceDetected: boolean;
  isWhitespaceSufficient: boolean;
  collisionDetected: boolean;
  status: 'ready' | 'warning' | 'error' | 'skipped';
  statusMessage: string;
  overlayConfig?: OverlayFitConfig;
}

export interface OverlayFitConfig {
  mode: 'normal' | 'compact' | 'scaled-compact' | 'mini-scaled' | 'ultra-compact' | 'qr-only' | 'insufficient';
  scaleFactor?: number;
  startY: number; // points from top
  totalHeight: number; // exact bounding box height of scaled promotional block
  naturalHeight?: number;
  availableHeight?: number;
  headingFontSize: number;
  reviewFontSize: number;
  storeCTAFontSize: number;
  subCTAFontSize: number;
  footerFontSize: number;
  qrSize: number;
  qrX: number;
  qrY: number;
  spacing: number;
  dividerGap?: number;
  safetyMarginTop: number;
  actualBounds?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };
}

export interface BatchProcessingStats {
  totalLabels: number;
  processedLabels: number;
  successfulLabels: number;
  warningLabels: number;
  failedLabels: number;
  isProcessing: boolean;
  currentLabelIndex: number;
  estimatedTimeRemainingMs?: number;
}

export interface ProcessedBatchResult {
  pdfBlob: Blob;
  pdfUrl: string;
  fileName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  labelResults: LabelDetectionResult[];
  processedAt: string;
}

export interface AcceptanceTestItem {
  id: number;
  name: string;
  description: string;
  category: 'Safety' | 'Detection' | 'Accounts' | 'Format' | 'Thermal' | 'System' | 'Flipkart' | 'Meesho' | 'Amazon';
  status: 'idle' | 'running' | 'passed' | 'failed';
  details?: string;
  timeMs?: number;
}

export * from './amazon/amazonTypes';

// Flipkart Label Crop Types
export interface FlipkartCropBox {
  x: number; // PDF points from page left
  y: number; // PDF points from page top
  width: number;
  height: number;
}

export interface FlipkartActiveCrop {
  pageNumber?: number;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  source: 'auto' | 'standard' | 'manual' | 'advanced';
  processed?: boolean;
}

export interface FlipkartCropSettings {
  cropMode: 'standard' | 'advanced';
  customCrop?: FlipkartCropBox;
  pageCustomCrops?: Record<number, FlipkartCropBox>;
  messageMode: 'default' | 'custom';
  defaultMessage: string;
  customMessage: string;
  outputFormat: '4x6-thermal' | 'exact-crop';
  enableMessage: boolean;
}

export interface FlipkartCropValidation {
  // 12 Explicit Quality Checks
  completeShippingLabelPresent: boolean;
  taxInvoiceExcluded: boolean;
  barcodeVisible: boolean;
  qrCodeVisible: boolean;
  shippingInfoVisible: boolean;
  messageVisible: boolean;
  messageOneLine: boolean;
  messageBelowLabel: boolean;
  noMessageOverlap: boolean;
  outputDimensions4x6: boolean;
  noBottomClipping: boolean;
  noInvoiceLeakage: boolean;

  // Aliases for compatibility
  shippingLabelDetected: boolean;
  completeLabelInsideCrop: boolean;
  invoiceOutsideCrop: boolean;
  barcodePreserved: boolean;
  qrPreserved: boolean;
  labelTextNotClipped: boolean;
  excessWhitespaceRemoved: boolean;
  messageOutsideLabel: boolean;

  allChecksPassed: boolean;
}

export interface FlipkartCropResult {
  pageIndex: number;
  originalWidth: number;
  originalHeight: number;
  cropBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  labelTopY: number;
  labelBottomY: number;
  labelLeftX: number;
  labelRightX: number;
  invoiceStartY: number;
  isBarcodeSafe: boolean;
  isQRSafe: boolean;
  status: 'ready' | 'warning' | 'error';
  statusMessage: string;
  detectedAWB?: string;
  detectedOrderNumber?: string;
  detectedCarrier?: string;
  detectedSKU?: string;
  detectedCustomerAddressLines?: string[];
  message: string;
  messageFontSize: number;
  validation?: FlipkartCropValidation;
}

export interface FlipkartBatchResult {
  pdfBlob: Blob;
  pdfUrl: string;
  fileName: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  pageResults: FlipkartCropResult[];
  processedAt: string;
}
