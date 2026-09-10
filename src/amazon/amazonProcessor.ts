import * as pdfjsLib from 'pdfjs-dist';
import {
  AmazonBatchResult,
  AmazonLabelOrderResult,
  AmazonProcessingOptions,
} from './amazonTypes';
import {
  ExtractedPageText,
  PageTextItem,
  normalizeText,
  isAmazonInvoiceStart,
  extractAmazonInvoiceDataFromPages,
} from './amazonInvoiceExtractor';
import {
  analyzeAmazonLabelBand,
  buildAmazonProcessedPDF,
} from './amazonLabelRenderer';

export interface AmazonProgressCallback {
  (currentOrder: number, totalOrders: number, message: string): void;
}

interface RawOrderGroup {
  labelPageIndex: number;
  invoicePageIndices: number[];
}

/**
 * Main Amazon Label Processing Engine V2
 *
 * ARCHITECTURAL PRINCIPLES:
 * 1. AMAZON IS NOT A CROPPING ENGINE:
 *    Original shipping labels are 100% PRESERVED in their original page dimensions.
 *    No cropping, no resizing, no 4×6 canvas creation.
 * 2. DYNAMIC SEQUENTIAL SCANNING:
 *    No odd/even parity assumption. Evaluates pages dynamically using the invoice-start marker:
 *    "Tax Invoice/Bill of Supply/Cash Memo".
 * 3. MULTI-PAGE INVOICE SUPPORT:
 *    Invoices of 1, 2, 3, 4+ pages are grouped to their preceding shipping label.
 * 4. DYNAMIC SKU & QUANTITY EXTRACTION:
 *    SKU extracted strictly from inside parentheses. ASIN is never used as SKU.
 *    Quantity extracted from product row.
 *    Formatted as "(SKU) | Quantity".
 * 5. OVERLAY PLACEMENT:
 *    Inserted into the designated blank horizontal band on the original page
 *    (below Seller table, above STVT/MAMA/PNUD boxes).
 * 6. INVOICES EXCLUDED:
 *    Final output PDF contains ONLY the processed shipping labels.
 */
export async function processAmazonPDF(
  pdfBytes: Uint8Array,
  fileName: string = 'amazon_labels.pdf',
  onProgress?: AmazonProgressCallback,
  options?: AmazonProcessingOptions
): Promise<AmazonBatchResult> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('The uploaded PDF document contains no pages.');
  }

  // Phase 1: Scan and extract text from EVERY page sequentially
  if (onProgress) {
    onProgress(0, numPages, `Scanning ${numPages} page(s) sequentially...`);
  }

  const extractedPages: ExtractedPageText[] = [];

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    const pageNum = pageIdx + 1;
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const items: PageTextItem[] = textContent.items
      .filter((item: any) => item && typeof item.str === 'string' && item.str.trim().length > 0)
      .map((item: any) => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || 10,
      }));

    const rawText = items.map((it) => it.str).join(' ');
    const norm = normalizeText(rawText);

    extractedPages.push({
      pageIndex: pageIdx,
      pageNumber: pageNum,
      rawText,
      normalizedText: norm,
      items,
    });
  }

  // Phase 2: Dynamic Document Classification & Sequence Grouping
  // Core Sequential Relationship:
  // 1. Start with candidate shipping-label page (beginning at Page 1, index 0).
  //    DO NOT require OCR text recognition on shipping label - label may be image/barcode based.
  // 2. Immediately inspect NEXT page for invoice-start heading: "Tax Invoice/Bill of Supply/Cash Memo".
  //    If next page contains this heading:
  //      CONFIRM: current page = Shipping Label, next page = Invoice START.
  // 3. Collect all continuation pages belonging to this invoice until next shipping-label sequence.
  // 4. Advance dynamically to next unprocessed document sequence without parity assumptions.
  const orderGroups: RawOrderGroup[] = [];
  let cursor = 0;

  while (cursor < numPages) {
    const candidateLabelIndex = cursor;
    const nextPageIndex = candidateLabelIndex + 1;

    if (nextPageIndex >= numPages) {
      // Reached the end of document with an unpaired candidate page.
      break;
    }

    // Inspect next page for Amazon invoice start
    const isNextPageInvoiceStart = isAmazonInvoiceStart(
      extractedPages[nextPageIndex].normalizedText
    );

    if (isNextPageInvoiceStart) {
      // CONFIRMED:
      // candidateLabelIndex is the Shipping Label
      // nextPageIndex is the Invoice START
      const invoiceStartIdx = nextPageIndex;
      const invoicePages: number[] = [invoiceStartIdx];

      // Identify all continuation pages belonging to this invoice
      // A subsequent page `p` (where p > invoiceStartIdx) is the next shipping label
      // IF AND ONLY IF:
      //   p + 1 < numPages AND extractedPages[p + 1] has an invoice START
      //   AND page `p` itself is not an invoice start.
      let nextSequenceStartIndex: number | null = null;

      for (let p = invoiceStartIdx + 1; p < numPages; p++) {
        const isPInvoiceStart = isAmazonInvoiceStart(extractedPages[p].normalizedText);
        const isPNextInvoiceStart =
          p + 1 < numPages && isAmazonInvoiceStart(extractedPages[p + 1].normalizedText);

        if (!isPInvoiceStart && isPNextInvoiceStart) {
          // Found the next shipping label at page `p`!
          nextSequenceStartIndex = p;
          break;
        } else {
          // Belongs to active invoice as continuation page
          invoicePages.push(p);
        }
      }

      orderGroups.push({
        labelPageIndex: candidateLabelIndex,
        invoicePageIndices: invoicePages,
      });

      if (nextSequenceStartIndex !== null) {
        cursor = nextSequenceStartIndex;
      } else {
        // Document fully processed
        break;
      }
    } else {
      // Next page does not have invoice start heading.
      // Advance to the next candidate page without falsely rejecting based on label OCR.
      cursor++;
    }
  }

  if (orderGroups.length === 0) {
    throw new Error(
      'No Amazon Tax Invoices ("Tax Invoice/Bill of Supply/Cash Memo") were found in the uploaded document. Please ensure you upload the complete Amazon PDF containing shipping labels and invoices.'
    );
  }

  const totalOrders = orderGroups.length;
  const orderResults: AmazonLabelOrderResult[] = [];

  // Phase 3: Extract SKU/Quantity & analyze blank band for each order
  for (let orderIdx = 0; orderIdx < totalOrders; orderIdx++) {
    const group = orderGroups[orderIdx];
    const labelPageNum = group.labelPageIndex + 1;
    const invoicePages = group.invoicePageIndices.map((idx) => extractedPages[idx]);
    const invoiceRangeStr = group.invoicePageIndices.map((idx) => idx + 1).join(', ');

    if (onProgress) {
      onProgress(
        orderIdx + 1,
        totalOrders,
        `Analyzing Order ${orderIdx + 1}/${totalOrders} (Label Page ${labelPageNum} ↔ Invoice Page(s) ${invoiceRangeStr})...`
      );
    }

    // Step A: Extract dynamic SKU inside parentheses & Quantity from invoice pages
    const invoiceData = await extractAmazonInvoiceDataFromPages(invoicePages);

    // Step B: Load shipping-label page and determine blank band coordinates
    const labelPage = await pdfDoc.getPage(labelPageNum);
    const orderResult = await analyzeAmazonLabelBand(
      labelPage,
      orderIdx,
      invoiceData,
      group.labelPageIndex
    );
    orderResults.push(orderResult);
  }

  if (onProgress) {
    onProgress(totalOrders, totalOrders, 'Overlaying SKU/Quantity on original shipping labels...');
  }

  // Phase 4: Build output PDF containing ONLY shipping labels with original dimensions
  const { pdfBytes: outputBytes, pdfBlob } = await buildAmazonProcessedPDF(
    pdfBytes,
    orderResults
  );
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const successCount = orderResults.filter((p) => p.status === 'ready').length;
  const failedCount = orderResults.length - successCount;

  return {
    pdfBlob,
    pdfUrl,
    fileName: fileName.replace(/\.pdf$/i, '') + '_processed.pdf',
    totalPages: numPages,
    totalOrders,
    totalPairs: totalOrders, // Backwards-compatible alias
    successCount,
    failedCount,
    pairResults: orderResults, // Backwards-compatible alias
    orderResults,
    processedAt: new Date().toISOString(),
  };
}
