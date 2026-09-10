import { AmazonInvoiceData } from './amazonTypes';

export interface PageTextItem {
  str: string;
  x: number; // PDF points from left
  y: number; // PDF points from bottom (PDF-lib system)
  width: number;
  height: number;
}

export interface ExtractedPageText {
  pageIndex: number;
  pageNumber: number;
  rawText: string;
  normalizedText: string;
  items: PageTextItem[];
}

// Common parenthesized terms in Amazon tax invoices that are NOT product SKUs
const IGNORED_PARENTHETICALS = new Set([
  'original for recipient',
  'duplicate for transporter',
  'triplicate for supplier',
  'tax inclusive',
  'inclusive of taxes',
  'exclusive of taxes',
  'approx',
  'approx.',
  'inr',
  'rs',
  'total',
  'igst',
  'cgst',
  'sgst',
  'utgst',
  'page',
  'pages',
  'billing',
  'shipping',
  'tax invoice',
  'bill of supply',
  'cash memo',
]);

/**
 * Normalizes text for robust string matching:
 * Collapses multiple spaces, newlines, tabs, and trims.
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a page is the START of an Amazon Tax Invoice.
 *
 * Primary marker: "Tax Invoice/Bill of Supply/Cash Memo"
 * Handles variations in spacing, slashes, whitespace, and capitalization.
 */
export function isAmazonInvoiceStart(normalizedText: string): boolean {
  // Primary regex matches standard Amazon invoice headers:
  // "tax invoice/bill of supply/cash memo"
  // "tax invoice / bill of supply / cash memo"
  // "tax invoice\nbill of supply\ncash memo"
  // "tax invoice bill of supply cash memo"
  // "tax invoice - bill of supply - cash memo"
  // "tax invoice | bill of supply | cash memo"
  if (
    /tax\s*invoice\s*[\/\\|\-]?\s*bill\s*of\s*supply\s*[\/\\|\-]?\s*cash\s*memo/i.test(normalizedText) ||
    /tax\s*invoice\s*bill\s*of\s*supply\s*cash\s*memo/i.test(normalizedText)
  ) {
    return true;
  }

  // Fallback: If "tax invoice" appears alongside either "bill of supply" or "cash memo"
  const hasTaxInvoice = normalizedText.includes('tax invoice');
  const hasBillOfSupply = normalizedText.includes('bill of supply');
  const hasCashMemo = normalizedText.includes('cash memo');

  return hasTaxInvoice && (hasBillOfSupply || hasCashMemo);
}

/**
 * Checks if a page is an Amazon Shipping Label.
 *
 * Shipping labels have Easy Ship header, Ship To block, tracking barcodes,
 * and delivery routing codes (STVT/MAMA/PNUD).
 */
export function isAmazonShippingLabel(normalizedText: string): boolean {
  if (isAmazonInvoiceStart(normalizedText)) {
    return false;
  }

  const hasShipTo = /\bship\s*to\s*[:\s]/i.test(normalizedText);
  const hasEasyShip = /\beasy\s*ship\b/i.test(normalizedText);
  const hasStandardDelivery = /\bstandard\s*delivery\b/i.test(normalizedText);
  const hasStationCodes = /\b(?:stvt|mama|pnud)\b/i.test(normalizedText);
  const hasItemTypes = /\bitem\s*types?\s*[:\s]/i.test(normalizedText);
  const hasAmazonIn = /amazon\.in/i.test(normalizedText);

  const score =
    (hasShipTo ? 3 : 0) +
    (hasEasyShip ? 3 : 0) +
    (hasStandardDelivery ? 2 : 0) +
    (hasStationCodes ? 2 : 0) +
    (hasItemTypes ? 2 : 0) +
    (hasAmazonIn ? 1 : 0);

  return score >= 3;
}

/**
 * Formats 1-based page numbers into a clean label:
 * e.g. [2] -> "Page 2"
 * [2, 3] -> "Pages 2–3"
 * [2, 3, 4] -> "Pages 2–4"
 */
export function formatPageRangeLabel(pageNumbers: number[]): string {
  if (pageNumbers.length === 0) return 'Page unknown';
  if (pageNumbers.length === 1) return `Page ${pageNumbers[0]}`;
  const first = pageNumbers[0];
  const last = pageNumbers[pageNumbers.length - 1];
  return `Pages ${first}–${last}`;
}

/**
 * Validates whether a candidate string qualifies as an authentic product SKU.
 */
function isValidSku(candidate: string, asin?: string): boolean {
  if (!candidate) return false;
  const clean = candidate.trim();
  if (clean.length === 0 || clean.length > 60) return false;

  const lower = clean.toLowerCase();
  if (IGNORED_PARENTHETICALS.has(lower)) return false;
  if (lower.startsWith('page ') || lower.startsWith('inr') || lower.startsWith('approx')) return false;

  // Crucial Rule: DO NOT use the ASIN as the SKU
  if (asin && clean.toUpperCase() === asin.toUpperCase()) {
    return false;
  }

  // Filter out dates and currency numbers
  if (/^[0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4}$/.test(clean)) return false;
  if (/^[\d.,₹$€£+\-%]+$/.test(clean)) return false;

  // Must contain at least one alphanumeric character
  return /[A-Za-z0-9]/.test(clean);
}

/**
 * Extracts SKU and Quantity from all invoice pages belonging to a specific order.
 *
 * Requirements:
 * - Dynamic SKU extraction from parentheses (e.g. "B0HDPNNVNY (DOLL)" -> SKU: "DOLL").
 * - ASIN is NEVER used as the SKU.
 * - Dynamic Quantity extraction from product row / Qty column.
 * - Result formatted strictly as: "(SKU) | Quantity", e.g. "(DOLL) | 1".
 * - Never guesses or hardcodes; returns clear errors on failure.
 */
export async function extractAmazonInvoiceDataFromPages(
  invoicePages: ExtractedPageText[]
): Promise<AmazonInvoiceData> {
  const pageIndices = invoicePages.map((p) => p.pageIndex);
  const pageNumbers = invoicePages.map((p) => p.pageNumber);
  const pageRangeLabel = formatPageRangeLabel(pageNumbers);

  const combinedRawText = invoicePages.map((p) => p.rawText).join('\n');
  const allItems: PageTextItem[] = invoicePages.flatMap((p) => p.items);

  // Look for Order ID & Invoice Number
  const orderIdMatch = combinedRawText.match(/\b\d{3}-\d{7}-\d{7}\b/);
  const orderId = orderIdMatch ? orderIdMatch[0] : undefined;

  const invoiceNoMatch = combinedRawText.match(/Invoice\s*(?:Number|No\.?)[:\s]*([A-Z0-9\-_]+)/i);
  const invoiceNumber = invoiceNoMatch ? invoiceNoMatch[1] : undefined;

  // 1. Detect ASIN (10-character alphanumeric starting with B0 or standard 10-char Amazon ID)
  // Note: ASIN is metadata only and must NOT be used as the SKU.
  const asinMatch = combinedRawText.match(/\b(B0[A-Z0-9]{8}|[A-Z0-9]{10})\b/);
  const asin = asinMatch ? asinMatch[1] : undefined;

  // 2. Extract SKU specifically from inside parentheses or explicit SKU field
  let extractedSku: string | null = null;

  // Pattern 1: Explicit SKU field: e.g. "SKU: MAGPAD-KEY-01", "Seller SKU: MAGPAD", "SKU: (DOLL)"
  const explicitSkuMatch = combinedRawText.match(
    /(?:Seller\s*)?SKU\s*[:=\-|]\s*(?:\(([^)\r\n]+)\)|([A-Za-z0-9\-_./]+))/i
  );
  if (explicitSkuMatch) {
    const candidate = (explicitSkuMatch[1] || explicitSkuMatch[2] || '').trim();
    if (isValidSku(candidate, asin)) {
      extractedSku = candidate;
    }
  }

  // Pattern 2: ASIN followed directly by (SKU), e.g. "B0HDPNNVNY (DOLL)"
  if (!extractedSku) {
    const asinWithSkuMatch = combinedRawText.match(
      /\b(?:B0[A-Z0-9]{8}|[A-Z0-9]{10})\s*\(([^)\r\n]+)\)/i
    );
    if (asinWithSkuMatch && isValidSku(asinWithSkuMatch[1], asin)) {
      extractedSku = asinWithSkuMatch[1].trim();
    }
  }

  // Pattern 3: (SKU) preceding ASIN, e.g. "(DOLL) B0HDPNNVNY"
  if (!extractedSku) {
    const skuBeforeAsinMatch = combinedRawText.match(
      /\(([^)\r\n]+)\)\s*\b(?:B0[A-Z0-9]{8}|[A-Z0-9]{10})\b/i
    );
    if (skuBeforeAsinMatch && isValidSku(skuBeforeAsinMatch[1], asin)) {
      extractedSku = skuBeforeAsinMatch[1].trim();
    }
  }

  // Pattern 4: Parenthesized code inside product description
  if (!extractedSku) {
    const allParenMatches = Array.from(combinedRawText.matchAll(/\(([^)\r\n]+)\)/g));
    for (const match of allParenMatches) {
      const candidate = match[1].trim();
      if (isValidSku(candidate, asin)) {
        extractedSku = candidate;
        break;
      }
    }
  }

  // Pattern 5: Plain SKU: ABC123 if parentheses were omitted
  if (!extractedSku) {
    const explicitPlainSku = combinedRawText.match(/\bSKU\s*[:=\-]\s*([A-Za-z0-9\-_]+)/i);
    if (explicitPlainSku && isValidSku(explicitPlainSku[1], asin)) {
      extractedSku = explicitPlainSku[1].trim();
    }
  }

  // 3. Extract Quantity dynamically from the product-table Qty column
  // RULES:
  // - MUST distinguish "Sl. No." column from "Qty / Quantity" column.
  // - "Sl. No. = 1" must NEVER be treated as Quantity.
  // - First numeric token must NOT be blindly accepted.
  // - NEVER hardcode Quantity = 1 or fallback to 1 without evidence.
  let extractedQty: number | null = null;

  // Strategy 0: Mathematical Product-Table Verification (Unit Price * Qty = Net Amount)
  // In authentic Amazon invoices, the product row contains: Unit Price (e.g. ₹218.10), Qty (e.g. 2), Net Amount (e.g. ₹436.20).
  // Multiplying Unit Price * Qty = Net Amount confirms the exact Qty with 100% mathematical certainty.
  const mathMatches = Array.from(
    combinedRawText.matchAll(
      /(?:₹|INR|\b)\s*(\d+\.\d{2})\s+(?:(?:₹|INR|\b)\s*0\.00\s+)?(\d{1,3})\s+(?:₹|INR|\b)\s*(\d+\.\d{2})/gi
    )
  );
  for (const m of mathMatches) {
    const unitPrice = parseFloat(m[1]);
    const qtyCandidate = parseInt(m[2], 10);
    const netAmount = parseFloat(m[3]);
    if (qtyCandidate > 0 && qtyCandidate < 1000) {
      if (Math.abs(unitPrice * qtyCandidate - netAmount) < 0.05) {
        extractedQty = qtyCandidate;
        break;
      }
    }
  }

  // Strategy 1: Unit Price -> Qty -> Net Amount row sequence in product table
  if (extractedQty === null) {
    const generalRowMatch = combinedRawText.match(
      /(?:₹|INR|\b)\s*\d+\.\d{2}\s+(?:(?:₹|INR|\b)\s*\d+\.\d{2}\s+)?(\d{1,3})\s+(?:₹|INR|\b)\s*\d+\.\d{2}/i
    );
    if (generalRowMatch) {
      const val = parseInt(generalRowMatch[1], 10);
      if (val > 0 && val < 1000) {
        extractedQty = val;
      }
    }
  }

  // Strategy 2: Direct column geometry filtering in allItems
  // Locate the Sl. No. column to define the forbidden region
  const slNoHeaderItem = allItems.find(
    (it) => /^(?:Sl\.?\s*No\.?|S\.?\s*No\.?|Serial\s*No\.?)$/i.test(it.str.trim()) || /\bSl\.?\s*No\b/i.test(it.str)
  );
  // Sl. No. column is on the far left (typically x < 80 pt). Any number with x <= slNoColMaxX is Sl. No.!
  const slNoColMaxX = slNoHeaderItem ? slNoHeaderItem.x + slNoHeaderItem.width + 30 : 90;

  if (extractedQty === null && allItems && allItems.length > 0) {
    const qtyHeaderItems = allItems.filter(
      (it) => /\b(?:Qty|Quantity)\b/i.test(it.str) && it.x > slNoColMaxX
    );

    for (const qItem of qtyHeaderItems) {
      const headerY = qItem.y;
      let colCenterX = qItem.x + qItem.width / 2;
      const match = qItem.str.match(/\b(?:Qty|Quantity)\b/i);
      if (match && match.index !== undefined && qItem.str.length > 10) {
        const charRatio = (match.index + match[0].length / 2) / qItem.str.length;
        colCenterX = qItem.x + qItem.width * charRatio;
      }

      // Filter candidate items directly in the Qty column under the header
      const candidates = allItems
        .filter(
          (it) =>
            it.y < headerY - 3 &&
            it.y > headerY - 250 &&
            it.x >= colCenterX - 45 &&
            it.x <= colCenterX + 45 &&
            it.x > slNoColMaxX + 40 && // STRICTLY exclude Sl. No. column
            /^\d+$/.test(it.str.trim()) &&
            !it.str.includes('.') &&
            !it.str.includes('%') &&
            !it.str.includes('₹')
        )
        .sort((a, b) => b.y - a.y); // Top-most product row first

      if (candidates.length > 0) {
        const val = parseInt(candidates[0].str.trim(), 10);
        if (val > 0 && val < 1000) {
          extractedQty = val;
          break;
        }
      }
    }
  }

  // Strategy 3: Product-row cross-referencing in allItems
  // If not yet resolved, locate the product row and identify the integer in the Qty column (x > 150),
  // strictly rejecting Sl. No. (x <= slNoColMaxX)
  if (extractedQty === null && allItems && allItems.length > 0) {
    const productRowItems = allItems.filter(
      (it) =>
        (extractedSku && it.str.includes(extractedSku)) ||
        (asin && it.str.includes(asin)) ||
        (it.str.length > 6 && !it.str.includes('Invoice') && !it.str.includes('Seller'))
    );

    if (productRowItems.length > 0) {
      const rowY = productRowItems[0].y;
      const rowIntegers = allItems
        .filter(
          (it) =>
            Math.abs(it.y - rowY) < 18 &&
            /^\d+$/.test(it.str.trim()) &&
            !it.str.includes('.') &&
            !it.str.includes('%') &&
            !it.str.includes('₹')
        )
        .sort((a, b) => a.x - b.x); // Left to right

      // rowIntegers[0] at x < 100 is Sl. No.! NEVER use it!
      // Look for the integer in the Qty column region (typically 180 pt <= x <= 450 pt)
      const qtyColItem = rowIntegers.find((it) => it.x > slNoColMaxX + 50 && it.x < 480);
      if (qtyColItem) {
        const val = parseInt(qtyColItem.str.trim(), 10);
        if (val > 0 && val < 1000) {
          extractedQty = val;
        }
      }
    }
  }

  // Strategy 4: Explicit labeled quantity regex (e.g. "Qty: 2", "Qty = 2", "Quantity: 2")
  if (extractedQty === null) {
    const explicitQtyRegex = combinedRawText.match(/\b(?:Qty|Quantity)\s*[:=\-|]?\s*(\d+)\b/i);
    if (explicitQtyRegex) {
      const val = parseInt(explicitQtyRegex[1], 10);
      if (val > 0 && val < 1000) {
        extractedQty = val;
      }
    }
  }

  // Strategy 5: Table row pipe-delimited pattern
  // e.g. "| 1 | Product Title | 100.00 | 0.00 | 2 | 200.00 |"
  if (extractedQty === null) {
    const pipeMatch = combinedRawText.match(
      /\|\s*\d+\s*\|\s*[^|\r\n]+\|[^|\r\n]*\|[^|\r\n]*\|\s*(\d+)\s*\|/
    );
    if (pipeMatch) {
      const val = parseInt(pipeMatch[1], 10);
      if (val > 0 && val < 1000) {
        extractedQty = val;
      }
    }
  }

  // NOTE: Zero guessing, zero hardcoded fallback to 1.
  // If Quantity cannot be reliably extracted from the product-table Qty column,
  // we do NOT silently use 1, substitute Sl. No., or guess.

  // Fail-Safe Reporting: Distinguish SKU found/missing and Quantity found/missing
  // Case A: Both SKU and Quantity extracted successfully
  if (extractedSku && extractedQty && extractedQty > 0) {
    const formattedText = `(${extractedSku}) | ${extractedQty}`;
    return {
      pageIndices,
      pageNumbers,
      pageRangeLabel,
      rawSku: extractedSku,
      formattedText,
      quantity: extractedQty,
      asin,
      orderId,
      invoiceNumber,
      extractionSuccess: true,
    };
  }

  // Case B: SKU extracted successfully, but Quantity could not be determined
  if (extractedSku && (!extractedQty || extractedQty <= 0)) {
    return {
      pageIndices,
      pageNumbers,
      pageRangeLabel,
      rawSku: extractedSku,
      formattedText: '',
      quantity: 0,
      asin,
      orderId,
      invoiceNumber,
      extractionSuccess: false,
      errorMessage: `Quantity could not be extracted from Invoice ${pageRangeLabel} (SKU "${extractedSku}" was identified).`,
    };
  }

  // Case C: Quantity extracted successfully, but SKU could not be determined
  if (!extractedSku && extractedQty && extractedQty > 0) {
    return {
      pageIndices,
      pageNumbers,
      pageRangeLabel,
      rawSku: '',
      formattedText: '',
      quantity: extractedQty,
      asin,
      orderId,
      invoiceNumber,
      extractionSuccess: false,
      errorMessage: `SKU could not be extracted from Invoice ${pageRangeLabel} (Quantity ${extractedQty} was identified).`,
    };
  }

  // Case D: Neither SKU nor Quantity could be extracted
  return {
    pageIndices,
    pageNumbers,
    pageRangeLabel,
    rawSku: '',
    formattedText: '',
    quantity: 0,
    asin,
    orderId,
    invoiceNumber,
    extractionSuccess: false,
    errorMessage: `Unable to extract SKU and Quantity from Invoice ${pageRangeLabel}.`,
  };
}
