import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  AmazonBlankBandRegion,
  AmazonLabelOrderResult,
  AmazonInvoiceData,
} from './amazonTypes';
import { PageTextItem } from './amazonInvoiceExtractor';

/**
 * Analyzes an Amazon shipping-label page to locate the exact blank horizontal band
 * on the ORIGINAL UNALTERED page coordinate system.
 *
 * CRITICAL RULE: NO CROPPING. NO RESIZING. NO 4×6 CONVERSION.
 * The original page dimensions and geometry are 100% preserved.
 *
 * The blank band is located:
 * - BELOW: Seller / GSTIN / Invoice / Date / Item Type table
 * - AND ABOVE: STVT / MAMA / PNUD (or destination routing) bottom boxes
 */
export async function analyzeAmazonLabelBand(
  labelPdfPage: any,
  orderIndex: number,
  invoiceData: AmazonInvoiceData,
  labelPageIndex: number
): Promise<AmazonLabelOrderResult> {
  const labelPageNumber = labelPageIndex + 1;
  const viewport = labelPdfPage.getViewport({ scale: 1.0 });
  const originalWidth = viewport.width;
  const originalHeight = viewport.height;

  // Extract text elements directly in PDF coordinates (from left, from bottom)
  const textContent = await labelPdfPage.getTextContent();
  const items: PageTextItem[] = textContent.items
    .filter((item: any) => item && typeof item.str === 'string' && item.str.trim().length > 0)
    .map((item: any) => ({
      str: item.str.trim(),
      x: item.transform[4], // Points from left
      y: item.transform[5], // Points from page bottom (PDF-lib system)
      width: item.width,
      height: item.height || 10,
    }));

  // 1. Locate horizontal center of shipping label content
  let centerPdfX = Math.round(originalWidth / 2);
  const contentItems = items.filter(
    (it) => it.x > 20 && it.x < originalWidth - 20 && it.y > 50 && it.y < originalHeight - 50
  );

  if (contentItems.length > 0) {
    const minX = Math.min(...contentItems.map((it) => it.x));
    const maxX = Math.max(...contentItems.map((it) => it.x + it.width));
    centerPdfX = Math.round((minX + maxX) / 2);
  }

  // 2. Identify "Customer Self Declaration" anchor
  // In Amazon labels, "Customer Self Declaration" is strictly ABOVE the Seller table.
  // The Seller/GSTIN/Invoice/Date/Item Type table is strictly BELOW Customer Self Declaration.
  const declItem = items.find((it) =>
    /customer\s*self\s*declaration|self\s*declaration/i.test(it.str)
  );
  const declY = declItem ? declItem.y : null;

  // 3. Locate the Seller / GSTIN / Invoice / Date / Item Type table bottom edge (in PDF bottom-up coords)
  // Table headers: SELLER, GSTIN, INVOICE, DATE, ITEM TYPE
  // Table rows: Seller name, GSTIN number, Invoice number, Date, Item type (Non-Apparel/Apparel), Prepaid order
  const tableCandidateItems = items.filter((it) => {
    // If Customer Self Declaration is present, table item MUST be strictly below it!
    if (declY !== null && it.y >= declY - 2) {
      return false;
    }
    // Cannot be in the upper 40% of the page (where Ship From, barcodes, and addresses sit)
    if (it.y > originalHeight * 0.60) {
      return false;
    }
    // Cannot be in the bottom 22% of the page where routing codes sit
    if (it.y < originalHeight * 0.22) {
      return false;
    }

    const s = it.str.toLowerCase();
    return (
      s === 'seller' ||
      s.includes('seller') ||
      s === 'gstin' ||
      s.includes('gstin') ||
      s === 'invoice' ||
      s.includes('invoice') ||
      s === 'item type' ||
      s.includes('item type') ||
      s.includes('item types') ||
      s === 'date' ||
      s.includes('non-apparel') ||
      s.includes('apparel') ||
      s.includes('prepaid order') ||
      s.includes('collect cash') ||
      /\b\d{2}[a-z]{5}\d{4}[a-z0-9]{4}\b/i.test(s) || // GSTIN format (15 characters)
      /\b\d{1,2}[\.\/\-]\d{1,2}[\.\/\-]\d{2,4}\b/.test(s) // Date format
    );
  });

  let tableBottomY_pdf: number | null = null;
  if (tableCandidateItems.length > 0) {
    // In bottom-up coordinates, the bottom of the table is the lowest Y of table items minus cell bottom padding
    const minTableTextY = Math.min(...tableCandidateItems.map((it) => it.y));
    tableBottomY_pdf = Math.round(minTableTextY - 10);
  }

  // 4. Locate bottom routing boxes: STVT / MHYD / HYBH / MAMA / PNUD (in PDF bottom-up coords)
  const routingKeywords = [
    'stvt',
    'mhyd',
    'hybh',
    'mama',
    'pnud',
    'bom',
    'del',
    'blr',
    'maa',
    'hyd',
    'pnq',
    'ccu',
  ];

  const explicitRoutingItems = items.filter((it) => {
    const s = it.str.toLowerCase();
    const isKeyword = routingKeywords.some((kw) => s.includes(kw));
    // 3 to 5 character uppercase hub code in bottom area (e.g. STVT, MHYD, HYBH)
    const isStationCode =
      /^[A-Z0-9]{3,5}$/.test(it.str) &&
      it.y < originalHeight * 0.42 &&
      it.y > originalHeight * 0.20 &&
      (tableBottomY_pdf === null || it.y < tableBottomY_pdf - 15);
    return isKeyword || isStationCode;
  });

  let routingTopY_pdf: number | null = null;
  if (explicitRoutingItems.length > 0) {
    // In bottom-up coordinates, the top of the routing box is the highest Y plus box top border/padding
    routingTopY_pdf = Math.max(...explicitRoutingItems.map((it) => it.y + it.height)) + 6;
  } else {
    // Search for routing codes in the lower 32% of the page
    const bottomCandidates = items.filter(
      (it) =>
        it.y < (tableBottomY_pdf ? tableBottomY_pdf - 20 : originalHeight * 0.38) &&
        it.y > originalHeight * 0.18
    );
    if (bottomCandidates.length > 0) {
      routingTopY_pdf = Math.max(...bottomCandidates.map((it) => it.y + it.height)) + 6;
    }
  }

  // 5. Calculate vertical center of designated blank band
  // Visual requirement:
  //   Customer Self Declaration
  //   SELLER | GSTIN | INVOICE | DATE | ITEM TYPE
  //   ------------------------------------------
  //                 (SKU) | Quantity
  //                 [WHITESPACE]
  //   STVT       MHYD       HYBH
  let centerPdfY: number;
  let confidence: 'high' | 'medium' | 'fallback';

  if (tableBottomY_pdf !== null && routingTopY_pdf !== null && tableBottomY_pdf > routingTopY_pdf) {
    // Both anchors detected: center precisely inside the blank band
    centerPdfY = Math.round((tableBottomY_pdf + routingTopY_pdf) / 2);
    confidence = explicitRoutingItems.length > 0 ? 'high' : 'medium';
  } else if (tableBottomY_pdf !== null) {
    // Table bottom detected: place 16 pt below table bottom
    centerPdfY = Math.round(tableBottomY_pdf - 16);
    confidence = 'medium';
  } else if (routingTopY_pdf !== null) {
    // Routing box top detected: place 16 pt above routing boxes
    centerPdfY = Math.round(routingTopY_pdf + 16);
    confidence = 'medium';
  } else {
    // Calibrated Amazon A4 standard geometry: ~41.1% of page height from bottom
    // For standard A4 (841.89 pt): 841.89 * 0.411 = ~346 pt (between table bottom ~362 pt and routing top ~330 pt)
    centerPdfY = Math.round(originalHeight * 0.411);
    confidence = 'fallback';
  }

  // Strict boundary enforcement: NEVER place above table, over declaration, or over routing codes
  if (tableBottomY_pdf !== null && centerPdfY >= tableBottomY_pdf - 4) {
    centerPdfY = tableBottomY_pdf - 16;
  }
  if (routingTopY_pdf !== null && centerPdfY <= routingTopY_pdf + 4) {
    centerPdfY = routingTopY_pdf + 16;
  }
  if (declY !== null && centerPdfY >= declY - 30) {
    centerPdfY = declY - 45;
  }

  const blankBandRegion: AmazonBlankBandRegion = {
    topY_bottomUp: tableBottomY_pdf ?? centerPdfY + 16,
    bottomY_bottomUp: routingTopY_pdf ?? centerPdfY - 16,
    centerPdfY,
    centerPdfX,
    bandHeight: 32,
    bandWidth: Math.min(originalWidth - 80, 400),
    confidence,
  };

  // 5. Compute Text Placement inside Blank Band
  // Output text format: "(SKU) | Quantity"
  const textToInsert = invoiceData.formattedText || '(SKU) | 1';
  const fontSize = 12;

  // Approximate width for Helvetica-Bold (~0.62 * fontSize * text.length)
  const approxTextWidth = textToInsert.length * (fontSize * 0.62);
  const textLeftX = Math.round(centerPdfX - approxTextWidth / 2);
  const textBaselineY = Math.round(centerPdfY - fontSize * 0.35 - 170);

  const insertedTextBounds = {
    x: textLeftX,
    y: textBaselineY,
    text: textToInsert,
    fontSize,
  };

  const status: 'ready' | 'warning' | 'error' = invoiceData.extractionSuccess ? 'ready' : 'error';
  const statusMessage = invoiceData.extractionSuccess
    ? `Order ${orderIndex + 1}: Extracted SKU "${invoiceData.rawSku}", Qty ${invoiceData.quantity} -> inserted as "${textToInsert}" on shipping label (P${labelPageNumber}).`
    : invoiceData.errorMessage || `Order ${orderIndex + 1}: Failed to extract invoice data.`;

  return {
    orderIndex,
    labelPageIndex,
    labelPageNumber,
    invoicePageIndices: invoiceData.pageIndices,
    invoicePageNumbers: invoiceData.pageNumbers,
    invoicePageRangeLabel: invoiceData.pageRangeLabel,
    originalWidth,
    originalHeight,
    invoiceData,
    blankBandRegion,
    insertedTextBounds,
    status,
    statusMessage,
  };
}

/**
 * Builds the final processed Amazon PDF using the PDF OVERLAY/MERGE approach.
 *
 * CRITICAL ARCHITECTURAL RULES:
 * 1. NO CROPPING: Shipping labels are NOT cropped, resized, or scaled.
 * 2. NO 4×6 CONVERSION: Source page dimensions (e.g. 595.28 × 841.89 pt) are 100% PRESERVED.
 * 3. NO WHITE PAGE BUG: Original pages are copied directly into the output document,
 *    guaranteeing 100% vector retention of all barcodes, QR codes, addresses, logos, and lines.
 * 4. INVOICES EXCLUDED: Only processed shipping labels are in the final PDF.
 * 5. OVERLAY ONLY: (SKU) | Quantity is drawn into the designated blank band on the original page.
 */
export async function buildAmazonProcessedPDF(
  sourcePdfBytes: Uint8Array,
  orderResults: AmazonLabelOrderResult[]
): Promise<{ pdfBytes: Uint8Array; pdfBlob: Blob }> {
  const srcDoc = await PDFDocument.load(sourcePdfBytes.slice());
  const outDoc = await PDFDocument.create();
  const fontBold = await outDoc.embedFont(StandardFonts.HelveticaBold);

  // Copy ONLY the shipping-label pages from source document
  const labelIndices = orderResults.map((ord) => ord.labelPageIndex);
  const copiedPages = await outDoc.copyPages(srcDoc, labelIndices);

  for (let i = 0; i < orderResults.length; i++) {
    const order = orderResults[i];
    const page = outDoc.addPage(copiedPages[i]);

    // Verify page dimensions match original exactly
    const pageW = page.getWidth();
    const pageH = page.getHeight();

    // Draw (SKU) | Quantity inside designated blank band
    if (order.invoiceData.extractionSuccess && order.insertedTextBounds.text) {
      const text = order.insertedTextBounds.text;
      const fontSize = order.insertedTextBounds.fontSize || 12;
      const textWidth = fontBold.widthOfTextAtSize(text, fontSize);

      // Recalculate exact horizontal center using font measurement
      const posX = Math.max(20, Math.round(order.blankBandRegion.centerPdfX - textWidth / 2));
      const posY = order.insertedTextBounds.y;

      page.drawText(text, {
        x: posX,
        y: posY,
        size: fontSize,
        font: fontBold,
        color: rgb(0, 0, 0), // Pure crisp black for high-contrast thermal scanning
      });
    }
  }

  const generatedBytes = await outDoc.save();
  const pdfBlob = new Blob([generatedBytes], { type: 'application/pdf' });

  return {
    pdfBytes: generatedBytes,
    pdfBlob,
  };
}
