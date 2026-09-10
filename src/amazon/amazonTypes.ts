export interface AmazonInvoiceData {
  pageIndices: number[]; // 0-based page indices of this invoice group (e.g. [1, 2])
  pageNumbers: number[]; // 1-based page numbers (e.g. [2, 3])
  pageRangeLabel: string; // e.g. "Pages 2–3" or "Page 2"
  rawSku: string; // The dynamic SKU extracted from parentheses, e.g. "DOLL"
  formattedText: string; // The exact required format: "(DOLL) | 1"
  quantity: number; // Extracted numeric quantity, e.g. 1
  asin?: string; // Optional detected ASIN, e.g. "B0HDPNNVNY" (never used as SKU)
  orderId?: string; // Optional detected Amazon Order ID
  invoiceNumber?: string;
  invoiceDate?: string;
  extractionSuccess: boolean;
  errorMessage?: string;
}

export interface AmazonBlankBandRegion {
  topY_bottomUp: number; // PDF bottom-up coordinate of table bottom
  bottomY_bottomUp: number; // PDF bottom-up coordinate of routing top
  centerPdfY: number; // Vertical center in PDF coordinate system
  centerPdfX: number; // Horizontal center of shipping label
  bandHeight: number;
  bandWidth: number;
  confidence: 'high' | 'medium' | 'fallback';
}

export interface AmazonLabelOrderResult {
  orderIndex: number; // 0-based order index
  labelPageIndex: number; // 0-based index of shipping label page
  labelPageNumber: number; // 1-based page number of shipping label page
  invoicePageIndices: number[]; // 0-based page indices of invoice pages
  invoicePageNumbers: number[]; // 1-based page numbers of invoice pages
  invoicePageRangeLabel: string; // e.g. "Page 2" or "Pages 2–4"
  originalWidth: number; // Unaltered original page width (pt)
  originalHeight: number; // Unaltered original page height (pt)
  invoiceData: AmazonInvoiceData;
  blankBandRegion: AmazonBlankBandRegion;
  insertedTextBounds: {
    x: number; // In PDF-lib coordinate system (from left)
    y: number; // In PDF-lib coordinate system (from bottom)
    text: string;
    fontSize: number;
  };
  status: 'ready' | 'warning' | 'error';
  statusMessage: string;
}

// Alias for backwards-compatibility with existing code
export type AmazonLabelPairResult = AmazonLabelOrderResult;

export interface AmazonBatchResult {
  pdfBlob: Blob;
  pdfUrl: string;
  fileName: string;
  totalPages: number;
  totalOrders: number;
  totalPairs: number; // Alias for totalOrders
  successCount: number;
  failedCount: number;
  pairResults: AmazonLabelOrderResult[]; // Backwards-compatible alias
  orderResults: AmazonLabelOrderResult[];
  processedAt: string;
}

export interface AmazonProcessingOptions {
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
}
