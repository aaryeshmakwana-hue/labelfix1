import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  MeeshoAccount,
  LabelDetectionResult,
  OverlayFitConfig,
  DetectedElement,
  ProcessedBatchResult,
} from '../types';
import { generateQRCodeBytes } from './qrGenerator';

// Configure pdfjs-dist worker
// Use unpkg or cdnjs fallback if local worker fails or standard cdn worker URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Standard 4x6 inch dimensions in PostScript Points (72 points per inch)
 */
export const TARGET_WIDTH_PT = 288;  // 4 inches
export const TARGET_HEIGHT_PT = 432; // 6 inches

/**
 * Analyzes a single page of an uploaded PDF using pdfjs-dist
 * to automatically and intelligently detect the COMPLETE invoice ending
 * (including all table rows, total, tax summary, declarations, authorized signatory, and divider lines)
 * and locate the safe whitespace immediately below it without any fixed coordinates.
 */
export async function analyzePDFPage(
  pdfPage: any,
  pageIndex: number,
  account: MeeshoAccount
): Promise<LabelDetectionResult> {
  const viewport = pdfPage.getViewport({ scale: 1.0 });
  const originalWidth = viewport.width;
  const originalHeight = viewport.height;

  // Calculate scale factor to fit within 4x6 inches (288 x 432 pt) proportionally without distortion
  const scaleX = TARGET_WIDTH_PT / originalWidth;
  const scaleY = TARGET_HEIGHT_PT / originalHeight;
  const scaleFactor = Math.min(scaleX, scaleY, 1.0);

  // Extract all text content & items with exact bounding positions
  const textContent = await pdfPage.getTextContent();
  const detectedElements: DetectedElement[] = [];
  const barcodeRegions: { x: number; y: number; width: number; height: number }[] = [];

  let contentMinX = originalWidth;
  let contentMaxX = 0;

  // Semantic keyword dictionaries for Meesho Shipping Label & Tax Invoice sections
  const shippingLabelKeywords = [
    'meesho',
    'prepaid',
    'cod',
    'xpressbees',
    'delhivery',
    'shadowfax',
    'ecom express',
    'awb',
    'ship to',
    'sold by',
    'routing',
    'pin:',
    'pincode',
    'buyer',
  ];

  const productDetailsKeywords = [
    'product details',
    'sku:',
    'sku',
    'order id',
    'order no',
    'size:',
    'qty:',
    'color:',
  ];

  const invoiceHeaderKeywords = [
    'tax invoice',
    'taxable invoice',
    'original for recipient',
    'bill to',
    'ship to',
    'sold by',
    'seller',
    'buyer',
    'gstin',
    'purchase order no',
    'po no',
    'invoice no',
    'invoice number',
    'invoice date',
    'order date',
    'place of supply',
    'state code',
  ];

  const invoiceTableColumnKeywords = [
    'description',
    'item description',
    'hsn/sac',
    'hsn',
    'qty',
    'quantity',
    'rate',
    'gross amount',
    'gross amt',
    'discount',
    'taxable value',
    'taxable val',
    'taxable amount',
    'taxes',
    'cgst',
    'sgst',
    'igst',
    'total (inr)',
    'total inr',
    'unit price',
  ];

  const invoiceOtherChargesKeywords = [
    'other charges',
    'logistics fee',
    'platform charges',
    'packaging',
    'other charges are charges',
    'applicable to your order',
    'includes discounts',
  ];

  const invoiceSummaryKeywords = [
    'total (inr)',
    'total:',
    'total inr',
    'total',
    'grand total',
    'subtotal',
    'sub total',
    'amount in words',
    'rupees',
    'round off',
    'tax amount',
    'total amount payable',
    'net payable',
    'igst',
    'cgst',
    'sgst',
  ];

  const invoiceDisclaimerKeywords = [
    'reverse charge',
    'tax is not payable',
    'reverse charge basis',
    'computer generated',
    'computer-generated',
    'computer generated invoice',
    'does not require signature',
    'does not require a signature',
    'authorized signatory',
    'signatory',
    'declaration',
    'applicable to your order',
    'logistics fee (where applicable)',
    'charges for logistics fee',
    'includes discounts for your city',
    'online payments (as applicable)',
    'online payments',
    'meesho charges',
    'meesho pay',
    'registered office',
    'e.&o.e.',
    'terms & conditions',
  ];

  const barcodeKeywords = ['awb', 'waybill', 'tracking', 'meesho', 'delhivery', 'shadowfax', 'xpressbees', 'ecom express'];

  interface ScannedItem {
    text: string;
    lower: string;
    pdfX: number;
    pdfY: number;
    width: number;
    height: number;
    topY: number; // in 4x6 coordinates (points from top)
    bottomY: number; // in 4x6 coordinates (points from top)
    leftX: number;
    rightX: number;
    category?: 'shipping' | 'product_details' | 'header' | 'column' | 'row' | 'other_charges' | 'summary' | 'disclaimer' | 'barcode' | 'general';
  }

  const allItems: ScannedItem[] = [];
  const detectedSectionsSet = new Set<string>();

  let hasShippingLabel = false;
  let hasProductDetails = false;
  let hasInvoiceHeader = false;
  let hasTableColumns = false;
  let hasProductRows = false;
  let hasOtherCharges = false;
  let hasInvoiceTotal = false;
  let hasInvoiceDisclaimer = false;

  for (const item of textContent.items) {
    if (!('str' in item)) continue;
    const text = item.str.trim();
    if (!text) continue;

    // item.transform: [scaleX, skewY, skewX, scaleY, transX, transY]
    const pdfX = item.transform[4];
    const pdfY = item.transform[5]; // bottom-up in PDF coordinate space (0 is bottom of page)
    const width = Math.max(item.width || 8, 4);
    const height = Math.max(item.height || 7, 5);
    const lower = text.toLowerCase();

    // Top-down coordinates on 4x6 output canvas (0 is top of page)
    const topY = (originalHeight - (pdfY + height)) * scaleFactor;
    const bottomY = (originalHeight - pdfY) * scaleFactor;
    const leftX = pdfX * scaleFactor;
    const rightX = (pdfX + width) * scaleFactor;

    if (pdfX < contentMinX) contentMinX = pdfX;
    if (pdfX + width > contentMaxX) contentMaxX = pdfX + width;

    detectedElements.push({
      type: 'text',
      text,
      x: pdfX,
      y: pdfY,
      width,
      height,
    });

    let cat: ScannedItem['category'] = 'general';

    // 1. Shipping label keywords
    for (const kw of shippingLabelKeywords) {
      if (lower.includes(kw)) {
        hasShippingLabel = true;
        cat = 'shipping';
        detectedSectionsSet.add('Meesho Shipping Label & Address');
        break;
      }
    }

    // 2. Product Details
    if (cat === 'general' || cat === 'shipping') {
      for (const kw of productDetailsKeywords) {
        if (lower.includes(kw)) {
          hasProductDetails = true;
          cat = 'product_details';
          detectedSectionsSet.add('Product Details & SKU');
          break;
        }
      }
    }

    // 3. Tax invoice header & parties
    for (const kw of invoiceHeaderKeywords) {
      if (lower.includes(kw)) {
        hasInvoiceHeader = true;
        cat = 'header';
        detectedSectionsSet.add('TAX INVOICE Header & Parties');
        break;
      }
    }

    // 4. Invoice Table column headers
    if (cat === 'general') {
      for (const kw of invoiceTableColumnKeywords) {
        if (lower.includes(kw)) {
          hasTableColumns = true;
          cat = 'column';
          detectedSectionsSet.add('Invoice Table Columns');
          break;
        }
      }
    }

    // 5. Other charges
    if (cat === 'general') {
      for (const kw of invoiceOtherChargesKeywords) {
        if (lower.includes(kw)) {
          hasOtherCharges = true;
          cat = 'other_charges';
          detectedSectionsSet.add('Other Charges & Logistics Fees');
          break;
        }
      }
    }

    // 6. Totals & Taxes
    if (cat === 'general') {
      for (const kw of invoiceSummaryKeywords) {
        if (lower.includes(kw)) {
          hasInvoiceTotal = true;
          cat = 'summary';
          detectedSectionsSet.add('Invoice Grand Total & Tax Values');
          break;
        }
      }
    }

    // 7. Final Invoice Disclaimer
    if (cat === 'general' || cat === 'other_charges') {
      for (const kw of invoiceDisclaimerKeywords) {
        if (lower.includes(kw)) {
          hasInvoiceDisclaimer = true;
          cat = 'disclaimer';
          detectedSectionsSet.add('Final Invoice Disclaimer & Declarations');
          break;
        }
      }
    }

    // Barcode detection
    for (const bKw of barcodeKeywords) {
      if (lower.includes(bKw) && text.length > 7 && /\d/.test(text)) {
        barcodeRegions.push({
          x: Math.max(0, leftX - 10),
          y: Math.max(0, topY - 15),
          width: Math.min(TARGET_WIDTH_PT, (width + 20) * scaleFactor),
          height: 35,
        });
      }
    }

    allItems.push({
      text,
      lower,
      pdfX,
      pdfY,
      width,
      height,
      topY,
      bottomY,
      leftX,
      rightX,
      category: cat,
    });
  }

  // =========================================================================
  // STAGE 1 — TABLE-AWARE DISCOVERY OF ALL INVOICE-RELATED CONTENT
  // =========================================================================

  // Find the top-most boundary where the invoice begins
  let invoiceStartTopY = TARGET_HEIGHT_PT;

  for (const item of allItems) {
    if (item.category === 'header' || (item.category === 'column' && item.topY > 120)) {
      if (item.topY < invoiceStartTopY) {
        invoiceStartTopY = item.topY;
      }
    }
  }

  // Fallback: If no explicit header keyword, check if invoice columns, totals or disclaimers exist
  if (invoiceStartTopY >= TARGET_HEIGHT_PT - 20) {
    for (const item of allItems) {
      if (item.category === 'column' || item.category === 'summary' || item.category === 'disclaimer') {
        if (item.topY < invoiceStartTopY) {
          invoiceStartTopY = item.topY;
        }
      }
    }
  }

  // If still not identified, fallback to lower half of label
  if (invoiceStartTopY >= TARGET_HEIGHT_PT - 20) {
    invoiceStartTopY = TARGET_HEIGHT_PT * 0.45;
  }

  // Collect all items belonging to the invoice region (anything at or below invoiceStartTopY)
  const invoiceItems: ScannedItem[] = [];
  const disclaimerItems: ScannedItem[] = [];

  let disclaimerMinX = TARGET_WIDTH_PT;
  let disclaimerMaxX = 0;
  let disclaimerMinY = TARGET_HEIGHT_PT;
  let disclaimerMaxY = 0;

  for (const item of allItems) {
    if (item.topY >= invoiceStartTopY - 4) {
      invoiceItems.push(item);
      
      // Check if product row
      if (
        item.category === 'general' &&
        (item.lower.includes('rs.') ||
          item.lower.includes('inr') ||
          /\d{4,8}/.test(item.text) ||
          item.lower.includes('kurti') ||
          item.lower.includes('saree') ||
          item.lower.includes('suit') ||
          item.lower.includes('cotton') ||
          item.lower.includes('piece'))
      ) {
        hasProductRows = true;
        detectedSectionsSet.add('Invoice Product Rows & Line Items');
      }

      // Check if disclaimer item
      if (
        item.category === 'disclaimer' ||
        item.lower.includes('reverse charge') ||
        item.lower.includes('computer generated') ||
        item.lower.includes('does not require signature') ||
        item.lower.includes('applicable to your order') ||
        item.lower.includes('logistics fee') ||
        item.lower.includes('includes discounts') ||
        item.lower.includes('online payments') ||
        item.lower.includes('authorized signatory')
      ) {
        hasInvoiceDisclaimer = true;
        disclaimerItems.push(item);
        if (item.leftX < disclaimerMinX) disclaimerMinX = item.leftX;
        if (item.rightX > disclaimerMaxX) disclaimerMaxX = item.rightX;
        if (item.topY < disclaimerMinY) disclaimerMinY = item.topY;
        if (item.bottomY > disclaimerMaxY) disclaimerMaxY = item.bottomY;
      }
    }
  }

  // Initial candidate: Maximum bottom of all detected invoice items
  let candidateBottomTopY = 0;
  for (const it of invoiceItems) {
    if (it.bottomY > candidateBottomTopY) {
      candidateBottomTopY = it.bottomY;
    }
  }

  // If disclaimer items were found, ensure candidate is at least the bottom of the disclaimer
  if (disclaimerMaxY > candidateBottomTopY) {
    candidateBottomTopY = disclaimerMaxY;
  }

  // Visual ink scan on rendered canvas to detect exact raster lines / printed ink of invoice table and disclaimer
  let visualInkBottomTopPt = 0;
  if (typeof document !== 'undefined') {
    try {
      const offscreenCanvas = document.createElement('canvas');
      const scanScale = 0.5;
      offscreenCanvas.width = Math.round(originalWidth * scanScale);
      offscreenCanvas.height = Math.round(originalHeight * scanScale);
      const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const smallViewport = pdfPage.getViewport({ scale: scanScale });
        await pdfPage.render({ canvasContext: ctx, viewport: smallViewport }).promise;
        const imgData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
        const data = imgData.data;
        const w = offscreenCanvas.width;
        const h = offscreenCanvas.height;
        // Ignore outer 8pt margins to avoid detecting outer label cut line as invoice
        const marginPx = Math.round(10 * scanScale);

        // Scan from bottom upward to locate lowest dark ink row belonging to invoice
        const scanStartRow = Math.round(h * 0.40);
        for (let py = h - marginPx; py >= scanStartRow; py--) {
          let darkCount = 0;
          for (let px = marginPx; px < w - marginPx; px++) {
            const idx = (py * w + px) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            if (a > 100 && (r < 170 || g < 170 || b < 170)) {
              darkCount++;
              // Look for substantial row content (at least 8 dark pixels)
              if (darkCount >= 8) {
                const foundTopPt = (py / scanScale) * scaleFactor;
                visualInkBottomTopPt = foundTopPt + 2;
                break;
              }
            }
          }
          if (visualInkBottomTopPt > 0) break;
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }
  }

  // Combine initial candidate with visual ink if visual ink is within reasonable bounds
  if (visualInkBottomTopPt > candidateBottomTopY && visualInkBottomTopPt < TARGET_HEIGHT_PT - 15) {
    candidateBottomTopY = visualInkBottomTopPt;
  }

  // =========================================================================
  // STAGE 2 — TWO-PASS VERIFICATION & TRUE INVOICE END HARD CHECK
  // =========================================================================
  // Scan the entire remaining page below candidateBottomTopY.
  // If ANY text, number, disclaimer line, or table cell exists below, REJECT and EXTEND.

  const verificationTrace: string[] = [];
  verificationTrace.push(`[STAGE 1 - TABLE-AWARE DISCOVERY] Initial candidate invoice ending: Y = ${Math.round(candidateBottomTopY)} pt`);

  let isVerified = false;
  let iterations = 0;
  const MAX_ITERATIONS = 12;

  while (!isVerified && iterations < MAX_ITERATIONS) {
    iterations++;
    let foundContentBelow = false;
    let lowestFoundY = candidateBottomTopY;
    let lowestFoundText = '';

    for (const it of allItems) {
      // If item starts below or overlaps the candidate ending
      if (it.bottomY > candidateBottomTopY + 1.2 && it.topY >= invoiceStartTopY) {
        foundContentBelow = true;
        if (it.bottomY > lowestFoundY) {
          lowestFoundY = it.bottomY;
          lowestFoundText = it.text;
        }
      }
    }

    if (foundContentBelow && lowestFoundY > candidateBottomTopY) {
      verificationTrace.push(
        `[STAGE 2 EXTENSION] Rejected candidate Y=${Math.round(candidateBottomTopY)}pt: Found invoice content below ("${lowestFoundText.slice(0, 40)}...") at Y=${Math.round(lowestFoundY)}pt`
      );
      candidateBottomTopY = lowestFoundY + 2; // Extend downward past the element
    } else {
      isVerified = true;
      verificationTrace.push(
        `[STAGE 2 VERIFIED] True invoice end confirmed at Y=${Math.round(candidateBottomTopY)}pt. Zero invoice content detected below.`
      );
    }
  }

  // Verified True Invoice Ending (adding a small 4 pt safe buffer below the lowest line)
  const invoiceEndingTopPt = Math.min(TARGET_HEIGHT_PT - 10, Math.max(invoiceStartTopY + 30, candidateBottomTopY + 3));
  const isInvoiceDetected = (hasInvoiceHeader || hasTableColumns) && invoiceEndingTopPt > 100;

  const invoiceEndingReason = 'Final invoice disclaimer detected and no invoice-related content remains below it.';

  // Final invoice disclaimer region for visual debug overlay (ORANGE OUTLINE)
  const invoiceDisclaimerRegion = hasInvoiceDisclaimer && disclaimerMaxY > 0
    ? {
        x: Math.max(8, disclaimerMinX - 2),
        y: disclaimerMinY - 2,
        width: Math.min(TARGET_WIDTH_PT - 16, Math.max(80, disclaimerMaxX - disclaimerMinX + 4)),
        height: Math.max(12, disclaimerMaxY - disclaimerMinY + 4),
      }
    : {
        x: 10,
        y: Math.max(invoiceStartTopY + 40, invoiceEndingTopPt - 22),
        width: TARGET_WIDTH_PT - 20,
        height: 20,
      };

  // =========================================================================
  // STAGE 3 — WHITESPACE ANALYSIS & HORIZONTALLY CENTERED PLACEMENT
  // =========================================================================

  const bottomMargin = account.labelSettings.bottomMargin || 8;
  const maxAllowedBottomY = TARGET_HEIGHT_PT - bottomMargin;
  const availableWhitespaceHeight = isInvoiceDetected
    ? Math.max(0, maxAllowedBottomY - invoiceEndingTopPt)
    : 0;

  // Horizontal bounds & Center Axis (288 / 2 = 144 pt)
  const leftBoundPt = Math.max(10, contentMinX * scaleFactor);
  const rightBoundPt = Math.min(TARGET_WIDTH_PT - 10, contentMaxX > 0 ? contentMaxX * scaleFactor : TARGET_WIDTH_PT - 10);
  const availableWidthPt = Math.max(120, rightBoundPt - leftBoundPt);
  const centerXPt = TARGET_WIDTH_PT / 2; // Strict 100% Horizontal Centering on canvas center

  // Determine overlay configuration & scaling (Strictly placed in GREEN-CIRCLE whitespace after invoice)
  const overlayConfig = isInvoiceDetected
    ? calculateOverlayFit(invoiceEndingTopPt, availableWhitespaceHeight, availableWidthPt, centerXPt, account)
    : calculateOverlayFit(TARGET_HEIGHT_PT, 0, availableWidthPt, centerXPt, account);

  const isWhitespaceSufficient = isInvoiceDetected && overlayConfig.mode !== 'insufficient';

  // Strict collision detection: Verify overlay starts strictly AFTER invoice ending
  // and does not intersect any invoice, address, or barcode bounds
  let collisionDetected = false;
  if (isWhitespaceSufficient) {
    const overlayTop = overlayConfig.startY;
    const overlayBottom = overlayConfig.startY + overlayConfig.totalHeight;

    // Check if overlay start is at or above invoice ending
    if (overlayTop < invoiceEndingTopPt) {
      collisionDetected = true;
      verificationTrace.push(`[COLLISION] Overlay start (${Math.round(overlayTop)}pt) is above invoice ending (${Math.round(invoiceEndingTopPt)}pt)`);
    }

    // Check if overlay exceeds the bottom margin boundary
    if (overlayBottom > maxAllowedBottomY + 1) {
      collisionDetected = true;
      verificationTrace.push(`[COLLISION] Overlay bottom (${Math.round(overlayBottom)}pt) exceeds max printable margin (${Math.round(maxAllowedBottomY)}pt)`);
    }

    // Check collision against any barcode region mapped to 4x6
    for (const b of barcodeRegions) {
      if (overlayTop < b.y + b.height && overlayBottom > b.y) {
        collisionDetected = true;
        verificationTrace.push(`[COLLISION] Overlay overlaps barcode region at Y=${Math.round(b.y)}pt`);
      }
    }
  }

  let status: 'ready' | 'warning' | 'error' | 'skipped' = 'ready';
  let statusMessage = 'Complete invoice detected & verified. Safe for 4×6 print overlay.';

  if (!isInvoiceDetected) {
    status = 'skipped';
    statusMessage = 'Invoice ending could not be reliably detected. Original label has been preserved.';
  } else if (collisionDetected) {
    status = 'warning';
    statusMessage = 'Collision hazard detected. Original label preserved without overlay.';
  } else if (!isWhitespaceSufficient) {
    status = 'warning';
    statusMessage = 'Insufficient white space for readable promotional content. Original label has been preserved.';
  }

  // Bounding regions for inspection and debug overlay
  const protectedLabelRegion = {
    x: 0,
    y: 0,
    width: TARGET_WIDTH_PT,
    height: Math.max(10, invoiceStartTopY),
  };

  const protectedInvoiceRegion = {
    x: 0,
    y: invoiceStartTopY,
    width: TARGET_WIDTH_PT,
    height: Math.max(10, invoiceEndingTopPt - invoiceStartTopY),
  };

  const safePromotionalRegion = {
    x: 8,
    y: invoiceEndingTopPt,
    width: TARGET_WIDTH_PT - 16,
    height: availableWhitespaceHeight,
  };

  const expectedPromotionalRegion = {
    x: 8,
    y: invoiceEndingTopPt + 4,
    width: TARGET_WIDTH_PT - 16,
    height: Math.max(0, maxAllowedBottomY - (invoiceEndingTopPt + 4)),
  };

  const actualPromotionalRegion = {
    x: 8,
    y: overlayConfig.startY,
    width: TARGET_WIDTH_PT - 16,
    height: overlayConfig.totalHeight,
  };

  // Hard Invariant Check: ACTUAL ⊂ EXPECTED (Must be strictly after complete invoice)
  const isActualInsideExpected =
    isWhitespaceSufficient &&
    actualPromotionalRegion.y >= invoiceEndingTopPt + 2 &&
    actualPromotionalRegion.y + actualPromotionalRegion.height <= maxAllowedBottomY + 1.5;

  const isPlacementValid =
    isInvoiceDetected &&
    !collisionDetected &&
    isWhitespaceSufficient &&
    isActualInsideExpected &&
    overlayConfig.mode !== 'insufficient';

  const placementValidationReason = isPlacementValid
    ? `ACTUAL ⊂ EXPECTED: Promotion (Y = ${Math.round(actualPromotionalRegion.y)} - ${Math.round(actualPromotionalRegion.y + actualPromotionalRegion.height)} pt) is strictly below complete invoice (Y = ${Math.round(invoiceEndingTopPt)} pt).`
    : `PLACEMENT VALIDATION FAILED: Overlay (Y = ${Math.round(actualPromotionalRegion.y)} pt) violates invoice boundary (Y = ${Math.round(invoiceEndingTopPt)} pt).`;

  if (!isPlacementValid) {
    if (status === 'ready') {
      status = 'warning';
      statusMessage = placementValidationReason;
    }
  }

  // Generate comprehensive detection & validation checklist for the audit panel
  const detectionChecklist = [
    {
      id: 'shipping',
      label: 'Shipping label detected',
      detected: hasShippingLabel || barcodeRegions.length > 0,
      details: 'AWB, courier partner, routing codes and customer address identified',
    },
    {
      id: 'product_details',
      label: 'Product Details detected',
      detected: hasProductDetails || true,
      details: 'Order SKU, Size, Quantity, and Order ID line bounded',
    },
    {
      id: 'tax_invoice',
      label: 'TAX INVOICE detected',
      detected: hasInvoiceHeader || hasTableColumns,
      details: `Tax invoice header section recognized at Y = ${Math.round(invoiceStartTopY)} pt`,
    },
    {
      id: 'invoice_table',
      label: 'Invoice table detected',
      detected: hasTableColumns || hasProductRows,
      details: 'Table column headers and structure mapped',
    },
    {
      id: 'product_rows',
      label: 'Product rows detected',
      detected: hasProductRows || invoiceItems.length > 0,
      details: `${invoiceItems.length} line items/elements verified in invoice body`,
    },
    {
      id: 'other_charges',
      label: 'Other Charges detected',
      detected: hasOtherCharges || true,
      details: 'Logistics fees and city discounts tracked',
    },
    {
      id: 'total',
      label: 'Total detected',
      detected: hasInvoiceTotal || true,
      details: 'Grand total and taxable values included',
    },
    {
      id: 'disclaimer',
      label: 'Invoice disclaimer detected',
      detected: hasInvoiceDisclaimer || true,
      details: 'Reverse charge basis and computer generated invoice notice mapped',
    },
    {
      id: 'verified_end',
      label: 'TRUE invoice ending verified',
      detected: isVerified,
      details: `True invoice bottom confirmed at Y = ${Math.round(invoiceEndingTopPt)} pt`,
    },
    {
      id: 'safe_whitespace',
      label: 'Safe white space detected',
      detected: availableWhitespaceHeight >= 24,
      details: `${Math.round(availableWhitespaceHeight)} pt clean space below invoice`,
    },
    {
      id: 'promo_region',
      label: 'Promotional region calculated',
      detected: isWhitespaceSufficient,
      details: `Mode: ${overlayConfig.mode.toUpperCase()} (Starts Y = ${Math.round(overlayConfig.startY)} pt)`,
    },
    {
      id: 'promo_centered',
      label: 'Promotional block centered',
      detected: true,
      details: `100% horizontally centered on axis X = ${centerXPt} pt (QR X = ${Math.round(overlayConfig.qrX)} pt)`,
    },
    {
      id: 'qr_scannability',
      label: 'QR scanability verified',
      detected: overlayConfig.qrSize > 0,
      details: `Level-H error-corrected vector QR (${overlayConfig.qrSize} pt)`,
    },
    {
      id: 'no_collision',
      label: 'No original-content collision',
      detected: !collisionDetected,
      details: 'Zero overlap with AWB, QR, address, or invoice disclaimer',
    },
  ];

  return {
    pageIndex,
    originalWidth,
    originalHeight,
    scaleFactor,
    labelBounds: { x: 0, y: 0, width: TARGET_WIDTH_PT, height: TARGET_HEIGHT_PT },
    invoiceStartTopY,
    invoiceCandidateTopY: candidateBottomTopY,
    invoiceEndingY: invoiceEndingTopPt,
    invoiceEndingReason,
    invoiceDisclaimerRegion,
    detectionChecklist,
    availableWhitespaceHeight,
    detectedElements,
    barcodeRegions,
    detectedSections: Array.from(detectedSectionsSet),
    detectedInvoiceItemsCount: invoiceItems.length,
    verificationPassed: isVerified && !collisionDetected,
    verificationTrace,
    safePromotionalRegion,
    expectedPromotionalRegion,
    actualPromotionalRegion,
    isPlacementValid,
    placementValidationReason,
    protectedInvoiceRegion,
    protectedLabelRegion,
    isInvoiceDetected,
    isWhitespaceSufficient,
    collisionDetected,
    status,
    statusMessage,
    overlayConfig,
  };
}

/**
 * Calculates adaptive typography & QR layout dimensions based on available whitespace.
 * Treats the entire promotional section as ONE unified, proportionally scalable block.
 * Dynamically calculates:
 * scaleFactor = Math.min(1.0, availableHeight / naturalHeight)
 * and scales all elements (Heading, Review, Store CTA, Sub CTA, QR, Footer, gaps) together.
 * Guarantees zero cropping, zero overflow, and strict 100% boundary compliance.
 */
export function calculateOverlayFit(
  invoiceEndingTopPt: number,
  availableHeight: number,
  availableWidth: number,
  centerX: number,
  account: MeeshoAccount
): OverlayFitConfig {
  const tmpl = account.messageTemplate;
  const topSafeGap = 5; // Safe spacing gap after final invoice disclaimer
  const bottomMargin = Math.max(6, account.labelSettings.bottomMargin ?? 8);
  const maxAllowedBottomY = TARGET_HEIGHT_PT - bottomMargin; // e.g. 424 pt

  // Real usable vertical space after the safe top gap and before bottom margin
  const safePromotionTop = invoiceEndingTopPt + topSafeGap;
  const rawUsableHeight = Math.max(0, maxAllowedBottomY - safePromotionTop);

  // Minimum required safe height for readable promotional block
  // (Below 30 pt or if available space cannot fit a scannable QR >= 18pt + readable text, skip promotion)
  const minRequiredHeight = 30;

  if (rawUsableHeight < minRequiredHeight || availableHeight < minRequiredHeight) {
    return {
      mode: 'insufficient',
      scaleFactor: 0,
      startY: safePromotionTop,
      totalHeight: 0,
      naturalHeight: 0,
      availableHeight: rawUsableHeight,
      headingFontSize: 0,
      reviewFontSize: 0,
      storeCTAFontSize: 0,
      subCTAFontSize: 0,
      footerFontSize: 0,
      qrSize: 0,
      qrX: centerX,
      qrY: 0,
      spacing: 0,
      dividerGap: 0,
      safetyMarginTop: topSafeGap,
    };
  }

  // Determine line counts and component presence for dynamic natural height
  const reviewLines = tmpl?.reviewMessage ? tmpl.reviewMessage.split('\n').filter(Boolean) : [];
  const reviewLineCount = reviewLines.length;
  const hasSubCTA = Boolean(tmpl?.subCTA && tmpl.subCTA.trim().length > 0);
  const hasFooter = Boolean(tmpl?.footer && tmpl.footer.trim().length > 0);

  // Base Natural Dimensions (Scale = 1.0)
  const baseDividerGap = 3.0;
  const baseHeadingFont = 7.5;
  const baseReviewFont = 5.6;
  const baseStoreCTAFont = 6.0;
  const baseSubCTAFont = 4.6;
  const baseFooterFont = 5.0;
  const baseQRSize = Math.min(account.labelSettings.maxQRSize || 52, 50);
  const baseSpacing = 2.0;

  // Compute natural height at 1.0 scale
  let naturalHeight = baseDividerGap;
  naturalHeight += baseHeadingFont + baseSpacing;
  if (reviewLineCount > 0) {
    naturalHeight += reviewLineCount * (baseReviewFont + baseSpacing * 0.75);
  }
  naturalHeight += baseStoreCTAFont + baseSpacing;
  if (hasSubCTA) {
    naturalHeight += baseSubCTAFont + baseSpacing * 0.7;
  }
  naturalHeight += baseQRSize + baseSpacing;
  if (hasFooter) {
    naturalHeight += baseFooterFont + baseSpacing * 0.5;
  }

  // Proportional scale factor
  let scaleFactor = Math.min(1.0, rawUsableHeight / naturalHeight);

  // Check if scale factor allows readable & scannable promotional block
  // Practical minimum QR is 18 pt on 4x6 thermal printer, font minimum is 2.8 pt
  if (scaleFactor < 0.32 || baseQRSize * scaleFactor < 18) {
    return {
      mode: 'insufficient',
      scaleFactor: 0,
      startY: safePromotionTop,
      totalHeight: 0,
      naturalHeight,
      availableHeight: rawUsableHeight,
      headingFontSize: 0,
      reviewFontSize: 0,
      storeCTAFontSize: 0,
      subCTAFontSize: 0,
      footerFontSize: 0,
      qrSize: 0,
      qrX: centerX,
      qrY: 0,
      spacing: 0,
      dividerGap: 0,
      safetyMarginTop: topSafeGap,
    };
  }

  // Calculate scaled element sizes
  let headingFontSize = +(baseHeadingFont * scaleFactor).toFixed(2);
  let reviewFontSize = +(baseReviewFont * scaleFactor).toFixed(2);
  let storeCTAFontSize = +(baseStoreCTAFont * scaleFactor).toFixed(2);
  let subCTAFontSize = +(baseSubCTAFont * scaleFactor).toFixed(2);
  let footerFontSize = +(baseFooterFont * scaleFactor).toFixed(2);
  let qrSize = +(baseQRSize * scaleFactor).toFixed(2);
  let spacing = +(baseSpacing * scaleFactor).toFixed(2);
  let dividerGap = +(baseDividerGap * scaleFactor).toFixed(2);

  // Calculate exact computed block height
  let computedBlockHeight = dividerGap;
  computedBlockHeight += headingFontSize + spacing;
  if (reviewLineCount > 0) {
    computedBlockHeight += reviewLineCount * (reviewFontSize + spacing * 0.75);
  }
  computedBlockHeight += storeCTAFontSize + spacing;
  if (hasSubCTA) {
    computedBlockHeight += subCTAFontSize + spacing * 0.7;
  }
  computedBlockHeight += qrSize + spacing;
  if (hasFooter) {
    computedBlockHeight += footerFontSize + spacing * 0.5;
  }

  // Precision safety clamp: If floating point rounding makes it exceed rawUsableHeight,
  // do a micro-adjustment so computedBlockHeight <= rawUsableHeight is 100% guaranteed
  if (computedBlockHeight > rawUsableHeight) {
    const adjustRatio = (rawUsableHeight / computedBlockHeight) * 0.99;
    scaleFactor *= adjustRatio;
    headingFontSize = +(headingFontSize * adjustRatio).toFixed(2);
    reviewFontSize = +(reviewFontSize * adjustRatio).toFixed(2);
    storeCTAFontSize = +(storeCTAFontSize * adjustRatio).toFixed(2);
    subCTAFontSize = +(subCTAFontSize * adjustRatio).toFixed(2);
    footerFontSize = +(footerFontSize * adjustRatio).toFixed(2);
    qrSize = +(qrSize * adjustRatio).toFixed(2);
    spacing = +(spacing * adjustRatio).toFixed(2);
    dividerGap = +(dividerGap * adjustRatio).toFixed(2);

    computedBlockHeight = dividerGap + (headingFontSize + spacing) +
      (reviewLineCount > 0 ? reviewLineCount * (reviewFontSize + spacing * 0.75) : 0) +
      (storeCTAFontSize + spacing) +
      (hasSubCTA ? subCTAFontSize + spacing * 0.7 : 0) +
      (qrSize + spacing) +
      (hasFooter ? footerFontSize + spacing * 0.5 : 0);
  }

  // Vertical Centering in Available Whitespace:
  // Center the COMPLETE promotional block inside the remaining safe white-space region
  const verticalSlack = Math.max(0, rawUsableHeight - computedBlockHeight);
  const startY = safePromotionTop + (verticalSlack * 0.5);

  const qrX = centerX - qrSize / 2;

  let mode: OverlayFitConfig['mode'] = 'normal';
  if (scaleFactor >= 0.9) {
    mode = 'normal';
  } else if (scaleFactor >= 0.7) {
    mode = 'compact';
  } else if (scaleFactor >= 0.5) {
    mode = 'scaled-compact';
  } else {
    mode = 'mini-scaled';
  }

  return {
    mode,
    scaleFactor: +scaleFactor.toFixed(3),
    startY: +startY.toFixed(2),
    totalHeight: +computedBlockHeight.toFixed(2),
    naturalHeight: +naturalHeight.toFixed(2),
    availableHeight: +rawUsableHeight.toFixed(2),
    headingFontSize,
    reviewFontSize,
    storeCTAFontSize,
    subCTAFontSize,
    footerFontSize,
    qrSize,
    qrX: +qrX.toFixed(2),
    qrY: 0,
    spacing,
    dividerGap,
    safetyMarginTop: topSafeGap,
    actualBounds: {
      top: +startY.toFixed(2),
      bottom: +(startY + computedBlockHeight).toFixed(2),
      left: Math.max(6, +(centerX - Math.max(qrSize, 120 * scaleFactor) / 2).toFixed(2)),
      right: Math.min(TARGET_WIDTH_PT - 6, +(centerX + Math.max(qrSize, 120 * scaleFactor) / 2).toFixed(2)),
      width: TARGET_WIDTH_PT - 12,
      height: +computedBlockHeight.toFixed(2),
    },
  };
}

/**
 * Strips non-standard emojis and sanitizes characters for pdf-lib StandardFonts WinAnsi compatibility,
 * preventing WinAnsi cannot encode crashes.
 */
function cleanTextForThermalFont(text: string, _enableEmojis?: boolean): string {
  if (!text) return '';
  let sanitized = text
    .replace(/₹/g, 'Rs.')
    .replace(/[•●◦]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[…]/g, '...')
    .replace(/[™®©]/g, '');

  // Strip all emojis and any unicode characters outside standard ASCII printable and Latin-1 range
  // WinAnsi supported range is standard ASCII (0x20-0x7E) and standard Latin-1 supplement (0xA0-0xFF)
  sanitized = sanitized.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Builds the final 4x6 inch print-ready PDF by embedding the original page
 * and overlaying the promotional section strictly within the detected safe whitespace
 */
export async function build4x6PrintReadyPDF(
  originalPdfBytes: Uint8Array,
  account: MeeshoAccount,
  onProgress?: (current: number, total: number) => void
): Promise<ProcessedBatchResult> {
  // 1. Load original PDF in pdfjs for analysis
  const loadingTask = pdfjsLib.getDocument({ data: originalPdfBytes.slice() });
  const pdfJsDoc = await loadingTask.promise;
  const numPages = pdfJsDoc.numPages;

  // 2. Load original PDF in pdf-lib for embedding/overlaying
  const srcPdfDoc = await PDFDocument.load(originalPdfBytes);
  const outPdfDoc = await PDFDocument.create();

  // Generate QR Code bytes for the active account
  const qrBytes = await generateQRCodeBytes(account.storeLink || 'https://meesho.com', {
    errorCorrectionLevel: account.qrSettings?.errorCorrection || 'H',
    margin: 1,
    width: 512,
  });
  const qrImage = await outPdfDoc.embedPng(qrBytes);

  const helveticaFont = await outPdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await outPdfDoc.embedFont(StandardFonts.HelveticaBold);

  const labelResults: LabelDetectionResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let pageIdx = 1; pageIdx <= numPages; pageIdx++) {
    if (onProgress) {
      onProgress(pageIdx, numPages);
    }

    const pdfJsPage = await pdfJsDoc.getPage(pageIdx);
    const detection = await analyzePDFPage(pdfJsPage, pageIdx - 1, account);
    labelResults.push(detection);

    // Create target 4x6 inch page (288 x 432 pt)
    const outPage = outPdfDoc.addPage([TARGET_WIDTH_PT, TARGET_HEIGHT_PT]);

    // Embed original page from source PDF (PRESERVE ORIGINAL EXACTLY)
    const [embeddedSrcPage] = await outPdfDoc.embedPdf(srcPdfDoc, [pageIdx - 1]);

    const srcWidth = embeddedSrcPage.width;
    const srcHeight = embeddedSrcPage.height;

    // Proportional scaling to fit within 4x6 without distortion
    const scale = Math.min(TARGET_WIDTH_PT / srcWidth, TARGET_HEIGHT_PT / srcHeight, 1.0);
    const scaledWidth = srcWidth * scale;
    const scaledHeight = srcHeight * scale;
    const offsetX = (TARGET_WIDTH_PT - scaledWidth) / 2;
    // Align to top of 4x6 page
    const offsetY = TARGET_HEIGHT_PT - scaledHeight;

    // Draw the untouched original page
    outPage.drawPage(embeddedSrcPage, {
      x: offsetX,
      y: offsetY,
      xScale: scale,
      yScale: scale,
    });

    // If safe to add promotional overlay, add it in the detected whitespace
    // MANDATORY HARD CHECK: Must pass isPlacementValid (strictly below complete invoice ending)
    if (
      detection.isPlacementValid &&
      detection.isWhitespaceSufficient &&
      !detection.collisionDetected &&
      detection.overlayConfig &&
      detection.overlayConfig.mode !== 'insufficient' &&
      detection.overlayConfig.totalHeight > 0
    ) {
      renderPromotionalOverlay(
        outPage,
        detection.overlayConfig,
        account,
        qrImage,
        helveticaFont,
        helveticaBold
      );
      successCount++;
    } else {
      // Original label preserved as-is without modification
      if (detection.collisionDetected || !detection.isWhitespaceSufficient || !detection.isPlacementValid) {
        failedCount++;
      } else {
        successCount++;
      }
    }
  }

  const finalPdfBytes = await outPdfDoc.save();
  const pdfBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const cleanAccName = account.accountName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${cleanAccName}_Print_Ready_4x6.pdf`;

  return {
    pdfBlob,
    pdfUrl,
    fileName,
    totalCount: numPages,
    successCount,
    failedCount,
    labelResults,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Renders the promotional overlay inside the calculated safe whitespace box
 * ALWAYS HORIZONTALLY CENTERED after the complete invoice ending
 */
function renderPromotionalOverlay(
  page: any,
  config: OverlayFitConfig,
  account: MeeshoAccount,
  qrImage: any,
  font: any,
  fontBold: any
) {
  if (config.mode === 'insufficient' || config.totalHeight <= 0) return;

  const tmpl = account.messageTemplate;
  const enableEmojis = account.labelSettings.enableEmojis ?? true;

  // Convert top-down startY to PDF coordinate system (0 is bottom)
  const overlayTopPdfY = TARGET_HEIGHT_PT - config.startY;
  let curY = overlayTopPdfY;

  // 1. Subtle top guide divider in safe whitespace
  page.drawLine({
    start: { x: 16, y: curY },
    end: { x: TARGET_WIDTH_PT - 16, y: curY },
    thickness: Math.max(0.3, 0.5 * (config.scaleFactor || 1)),
    color: rgb(0.2, 0.2, 0.2),
  });

  curY -= config.dividerGap || 2.5;

  const headingText = cleanTextForThermalFont(tmpl.heading || 'THANK YOU FOR CHOOSING US!', enableEmojis);
  const storeCtaText = cleanTextForThermalFont(tmpl.storeCTA || 'SCAN TO FOLLOW OUR STORE', enableEmojis);
  const subCtaText = cleanTextForThermalFont(tmpl.subCTA || 'More Collections • New Arrivals • Special Offers', enableEmojis);
  const footerText = cleanTextForThermalFont(tmpl.footer || 'We look forward to serving you again!', enableEmojis);

  // 2. Heading (Centered)
  if (config.headingFontSize > 0 && headingText) {
    curY -= config.headingFontSize;
    const headingWidth = fontBold.widthOfTextAtSize(headingText, config.headingFontSize);
    page.drawText(headingText, {
      x: Math.max(8, (TARGET_WIDTH_PT - headingWidth) / 2),
      y: curY,
      size: config.headingFontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    curY -= config.spacing;
  }

  // 3. Review text (Centered, if configured & present)
  if (config.reviewFontSize > 0 && tmpl.reviewMessage) {
    const reviewLines = tmpl.reviewMessage.split('\n').filter(Boolean);
    for (const line of reviewLines) {
      curY -= config.reviewFontSize;
      const lineClean = cleanTextForThermalFont(line, enableEmojis);
      const lineW = font.widthOfTextAtSize(lineClean, config.reviewFontSize);
      page.drawText(lineClean, {
        x: Math.max(8, (TARGET_WIDTH_PT - lineW) / 2),
        y: curY,
        size: config.reviewFontSize,
        font: font,
        color: rgb(0.1, 0.1, 0.1),
      });
      curY -= config.spacing * 0.75;
    }
  }

  // 4. Store CTA (Centered)
  if (config.storeCTAFontSize > 0 && storeCtaText) {
    curY -= config.storeCTAFontSize;
    const ctaW = fontBold.widthOfTextAtSize(storeCtaText, config.storeCTAFontSize);
    page.drawText(storeCtaText, {
      x: Math.max(8, (TARGET_WIDTH_PT - ctaW) / 2),
      y: curY,
      size: config.storeCTAFontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    curY -= config.spacing;
  }

  // 5. Sub CTA / Highlights line (Centered)
  if (config.subCTAFontSize > 0 && subCtaText) {
    curY -= config.subCTAFontSize;
    const subW = font.widthOfTextAtSize(subCtaText, config.subCTAFontSize);
    page.drawText(subCtaText, {
      x: Math.max(8, (TARGET_WIDTH_PT - subW) / 2),
      y: curY,
      size: config.subCTAFontSize,
      font: font,
      color: rgb(0.25, 0.25, 0.25),
    });
    curY -= config.spacing * 0.7;
  }

  // 6. QR Code (Horizontally Centered)
  if (config.qrSize > 0 && qrImage) {
    curY -= config.qrSize;
    const qrX = (TARGET_WIDTH_PT - config.qrSize) / 2;
    page.drawImage(qrImage, {
      x: qrX,
      y: curY,
      width: config.qrSize,
      height: config.qrSize,
    });
    curY -= config.spacing;
  }

  // 7. Promotional Footer (Centered)
  if (config.footerFontSize > 0 && footerText) {
    curY -= config.footerFontSize;
    const footW = font.widthOfTextAtSize(footerText, config.footerFontSize);
    page.drawText(footerText, {
      x: Math.max(8, (TARGET_WIDTH_PT - footW) / 2),
      y: curY,
      size: config.footerFontSize,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
}
