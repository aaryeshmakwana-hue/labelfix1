import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleAmazonPairOptions {
  asin: string;
  sku: string; // e.g. "DOLL"
  qty: number; // e.g. 1
  productTitle?: string;
  customerName?: string;
  city?: string;
  pincode?: string;
  stationCodes?: [string, string, string]; // Default ["STVT", "MAMA", "PNUD"]
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Draws a realistic vector Code-128 barcode
 */
function drawBarcode(page: any, x: number, y: number, width: number, height: number, code: string) {
  let currentX = x;
  const numBars = 60;
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const barUnit = width / 80;

  for (let i = 0; i < numBars; i++) {
    const isBar = ((hash * (i + 13) + i * 7) % 10) > 3;
    const barW = isBar ? (((hash + i * 2) % 3) + 1) * barUnit * 0.85 : barUnit * 0.85;
    if (isBar && currentX + barW <= x + width) {
      page.drawRectangle({
        x: currentX,
        y: y,
        width: Math.max(0.9, barW),
        height: height,
        color: rgb(0, 0, 0),
      });
    }
    currentX += barW + barUnit * 0.4;
  }
}

/**
 * Adds an authentic Amazon shipping label page (Odd Page: 1, 3, 5...)
 * with the exact structure:
 * - Return address & Amazon Easy Ship
 * - Barcode & ATS tracking
 * - Ship To customer address
 * - Seller / GSTIN / Invoice / Date / Item Type table
 * - DESIGNATED BLANK HORIZONTAL BAND
 * - STVT / MAMA / PNUD bottom routing boxes
 */
export async function addAmazonShippingLabelPage(
  doc: PDFDocument,
  options: SampleAmazonPairOptions,
  pairIndex: number
) {
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Label Bounding Box on A4: centered horizontally, placed in top half
  const labelX = 98;
  const labelY_bottomUp = A4_HEIGHT - 610; // 570 pt height
  const labelW = 400;
  const labelH = 570;

  // Outer border rectangle around the shipping label
  page.drawRectangle({
    x: labelX,
    y: labelY_bottomUp,
    width: labelW,
    height: labelH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  // Convert top-down offsets for convenience
  const toBottomUp = (yOffsetFromLabelTop: number) =>
    labelY_bottomUp + labelH - yOffsetFromLabelTop;

  // Header: Amazon Easy Ship & Return info
  page.drawText('amazon.in', {
    x: labelX + 12,
    y: toBottomUp(22),
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('EASY SHIP', {
    x: labelX + 115,
    y: toBottomUp(21),
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('Standard Delivery', {
    x: labelX + labelW - 110,
    y: toBottomUp(20),
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Divider below header
  page.drawLine({
    start: { x: labelX, y: toBottomUp(30) },
    end: { x: labelX + labelW, y: toBottomUp(30) },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // ATS Tracking Barcode
  const trackingNumber = `ATS${pairIndex + 1}9840294819`;
  drawBarcode(page, labelX + 25, toBottomUp(80), labelW - 50, 42, trackingNumber);

  page.drawText(trackingNumber, {
    x: labelX + labelW / 2 - 50,
    y: toBottomUp(93),
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Divider below barcode
  page.drawLine({
    start: { x: labelX, y: toBottomUp(102) },
    end: { x: labelX + labelW, y: toBottomUp(102) },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Shipping Address block
  page.drawText('SHIP TO:', {
    x: labelX + 12,
    y: toBottomUp(120),
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const custName = options.customerName || 'Pooja Sharma';
  page.drawText(custName, {
    x: labelX + 65,
    y: toBottomUp(120),
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('Flat 402, Sunshine Heights, 15th Cross Road', {
    x: labelX + 12,
    y: toBottomUp(136),
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  const city = options.city || 'Bangalore';
  const pincode = options.pincode || '560034';
  page.drawText(`${city}, Karnataka, PIN: ${pincode}`, {
    x: labelX + 12,
    y: toBottomUp(150),
    size: 9,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  page.drawText('Contact: +91 98765 43210', {
    x: labelX + 12,
    y: toBottomUp(164),
    size: 8.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Divider below ship-to
  page.drawLine({
    start: { x: labelX, y: toBottomUp(176) },
    end: { x: labelX + labelW, y: toBottomUp(176) },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Secondary order & routing barcodes
  drawBarcode(page, labelX + 20, toBottomUp(210), labelW / 2 - 25, 30, `ORD-${pairIndex + 1}4829`);
  drawBarcode(page, labelX + labelW / 2 + 10, toBottomUp(210), labelW / 2 - 25, 30, `PIN-${pincode}`);

  // Divider below barcodes
  page.drawLine({
    start: { x: labelX, y: toBottomUp(245) },
    end: { x: labelX + labelW, y: toBottomUp(245) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // ==========================================================
  // Ship From Section
  // ==========================================================
  page.drawText('Ship From:', {
    x: labelX + 8,
    y: toBottomUp(258),
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('CloudRetail Services India Pvt Ltd, Plot 18, Electronic City, Bangalore 560100', {
    x: labelX + 54,
    y: toBottomUp(258),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Divider below Ship From
  page.drawLine({
    start: { x: labelX, y: toBottomUp(272) },
    end: { x: labelX + labelW, y: toBottomUp(272) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // ==========================================================
  // Customer Self Declaration Section
  // ==========================================================
  page.drawText('Customer Self Declaration', {
    x: labelX + 8,
    y: toBottomUp(286),
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(
    'I hereby declare that this consignment contains personal goods for sale as per Tax Invoice attached.',
    {
      x: labelX + 8,
      y: toBottomUp(299),
      size: 7,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    }
  );

  // Divider below Customer Self Declaration
  page.drawLine({
    start: { x: labelX, y: toBottomUp(312) },
    end: { x: labelX + labelW, y: toBottomUp(312) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // ==========================================================
  // Seller / GSTIN / Invoice / Date / Item Type table
  // Top: 322, Bottom: 476
  // ==========================================================
  const tableTopY = 322;
  const tableBottomY = 476;

  // Box enclosing Seller / Item Type table
  page.drawRectangle({
    x: labelX,
    y: toBottomUp(tableBottomY),
    width: labelW,
    height: tableBottomY - tableTopY,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Table Column Headers: # | SELLER | GSTIN | INVOICE | DATE | ITEM TYPE
  page.drawText('#', {
    x: labelX + 6,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('SELLER', {
    x: labelX + 22,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('GSTIN', {
    x: labelX + 115,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('INVOICE', {
    x: labelX + 205,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('DATE', {
    x: labelX + 275,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('ITEM TYPE', {
    x: labelX + 330,
    y: toBottomUp(tableTopY + 14),
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Header separator line
  page.drawLine({
    start: { x: labelX, y: toBottomUp(tableTopY + 22) },
    end: { x: labelX + labelW, y: toBottomUp(tableTopY + 22) },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // Table Row Data
  page.drawText('1', {
    x: labelX + 6,
    y: toBottomUp(tableTopY + 38),
    size: 8,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page.drawText('CloudRetail Services', {
    x: labelX + 22,
    y: toBottomUp(tableTopY + 38),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page.drawText('29AAAAA0000A1Z5', {
    x: labelX + 115,
    y: toBottomUp(tableTopY + 38),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page.drawText('IN-892401', {
    x: labelX + 205,
    y: toBottomUp(tableTopY + 38),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page.drawText('24.02.2026', {
    x: labelX + 275,
    y: toBottomUp(tableTopY + 38),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });
  page.drawText('Non-Apparel', {
    x: labelX + 330,
    y: toBottomUp(tableTopY + 38),
    size: 7.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Additional details inside the table box
  page.drawText('Prepaid Order - Do not collect cash', {
    x: labelX + 8,
    y: toBottomUp(tableTopY + 70),
    size: 8,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  page.drawText('Standard Delivery • Handover to Amazon Logistics', {
    x: labelX + 8,
    y: toBottomUp(tableTopY + 95),
    size: 7.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // ==========================================================
  // DESIGNATED HORIZONTAL BLANK BAND
  // Y-offset top: 476 (bottom of Seller table)
  // Y-offset bottom: 512 (top of STVT / MHYD / HYBH boxes)
  // Height = 36 pt
  // This area is intentionally left 100% blank on the original label!
  // ==========================================================

  // ==========================================================
  // STVT / MHYD / HYBH bottom routing boxes
  // Y-offset top: 512, Y-offset bottom: 566
  // ==========================================================
  const routingTopY = 512;
  const routingBottomY = 566;
  const boxHeight = routingBottomY - routingTopY;

  const stationCodes = options.stationCodes || ['STVT', 'MHYD', 'HYBH'];

  // 3 Boxes spanning label width
  const boxWidth = (labelW - 8) / 3;

  stationCodes.forEach((code, idx) => {
    const boxX = labelX + 2 + idx * (boxWidth + 2);
    page.drawRectangle({
      x: boxX,
      y: toBottomUp(routingBottomY),
      width: boxWidth,
      height: boxHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1.5,
    });

    const textW = fontBold.widthOfTextAtSize(code, 15);
    page.drawText(code, {
      x: boxX + (boxWidth - textW) / 2,
      y: toBottomUp(routingTopY + 34),
      size: 15,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * Adds an authentic Amazon Tax Invoice page (Even Page: 2, 4, 6...)
 * with the exact structure:
 * - Tax Invoice header
 * - Seller and buyer details
 * - Order ID and invoice date
 * - Product table with ASIN, parenthesized SKU, and Qty
 * - GST and total amounts
 */
export async function addAmazonInvoicePage(
  doc: PDFDocument,
  options: SampleAmazonPairOptions,
  pairIndex: number
) {
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const toBottomUp = (yOffset: number) => A4_HEIGHT - yOffset;

  // Header
  page.drawText('Tax Invoice/Bill of Supply/Cash Memo', {
    x: 40,
    y: toBottomUp(45),
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('(Original for Recipient)', {
    x: 40,
    y: toBottomUp(58),
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('Sold By:', {
    x: 40,
    y: toBottomUp(80),
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('CloudRetail Services India Pvt Ltd, SY No 14, Bommanahalli, Bangalore 560068', {
    x: 40,
    y: toBottomUp(94),
    size: 8,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  page.drawText('GSTIN: 29AAAAA0000A1Z5', {
    x: 40,
    y: toBottomUp(106),
    size: 8,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Order Details
  const orderId = `408-${1000000 + pairIndex * 111111}-${7654321 + pairIndex * 12345}`;
  page.drawText(`Order Number: ${orderId}`, {
    x: 350,
    y: toBottomUp(80),
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice Number: IN-89240${pairIndex + 1}`, {
    x: 350,
    y: toBottomUp(94),
    size: 8.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  page.drawText('Invoice Date: 24.02.2026', {
    x: 350,
    y: toBottomUp(106),
    size: 8.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  // Table Boundary
  const tableX = 40;
  const tableW = A4_WIDTH - 80;
  const tableTopY = 160;
  const tableH = 220;

  page.drawRectangle({
    x: tableX,
    y: toBottomUp(tableTopY + tableH),
    width: tableW,
    height: tableH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.75,
  });

  // Table Headers
  const headerHeight = 24;
  page.drawLine({
    start: { x: tableX, y: toBottomUp(tableTopY + headerHeight) },
    end: { x: tableX + tableW, y: toBottomUp(tableTopY + headerHeight) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  page.drawText('Sl. No.', { x: tableX + 8, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Description', { x: tableX + 50, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Unit Price', { x: tableX + 260, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Qty', { x: tableX + 320, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Net Amount', { x: tableX + 360, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Tax Rate', { x: tableX + 430, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });
  page.drawText('Total Amount', { x: tableX + 475, y: toBottomUp(tableTopY + 16), size: 8, font: fontBold });

  // Product Row
  const rowY = tableTopY + 42;
  page.drawText('1', { x: tableX + 15, y: toBottomUp(rowY), size: 8.5, font: fontRegular });

  const title = options.productTitle || 'Classic Soft Toy Figurine';
  page.drawText(title, {
    x: tableX + 50,
    y: toBottomUp(rowY),
    size: 8.5,
    font: fontBold,
  });

  // THE KEY IDENTIFIERS IN DESCRIPTION COLUMN:
  // e.g. "B0HDPNNVNY (DOLL)"
  const asinSkuLine = `${options.asin} (${options.sku})`;
  page.drawText(asinSkuLine, {
    x: tableX + 50,
    y: toBottomUp(rowY + 16),
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`HSN: 95030030`, {
    x: tableX + 50,
    y: toBottomUp(rowY + 30),
    size: 7.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Price & Qty
  const unitPrice = 499.0;
  const total = unitPrice * options.qty;

  page.drawText(`₹${unitPrice.toFixed(2)}`, {
    x: tableX + 260,
    y: toBottomUp(rowY),
    size: 8.5,
    font: fontRegular,
  });

  // Exact numeric Quantity in Qty column
  page.drawText(String(options.qty), {
    x: tableX + 325,
    y: toBottomUp(rowY),
    size: 9,
    font: fontBold,
  });

  page.drawText(`₹${total.toFixed(2)}`, {
    x: tableX + 360,
    y: toBottomUp(rowY),
    size: 8.5,
    font: fontRegular,
  });

  page.drawText('18% GST', {
    x: tableX + 430,
    y: toBottomUp(rowY),
    size: 8,
    font: fontRegular,
  });

  page.drawText(`₹${(total * 1.18).toFixed(2)}`, {
    x: tableX + 475,
    y: toBottomUp(rowY),
    size: 8.5,
    font: fontBold,
  });

  // Bottom Total
  page.drawLine({
    start: { x: tableX, y: toBottomUp(tableTopY + tableH - 30) },
    end: { x: tableX + tableW, y: toBottomUp(tableTopY + tableH - 30) },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  page.drawText('Grand Total:', {
    x: tableX + 360,
    y: toBottomUp(tableTopY + tableH - 12),
    size: 9,
    font: fontBold,
  });

  page.drawText(`₹${(total * 1.18).toFixed(2)}`, {
    x: tableX + 475,
    y: toBottomUp(tableTopY + tableH - 12),
    size: 9,
    font: fontBold,
  });

  // Signatory
  page.drawText('Authorized Signatory for CloudRetail Services India Pvt Ltd', {
    x: tableX + 280,
    y: toBottomUp(tableTopY + tableH + 40),
    size: 8,
    font: fontRegular,
  });
}

/**
 * Generates the EXACT required test case Amazon PDF:
 * Page 1: Amazon Shipping Label
 * Page 2: Corresponding Invoice with:
 *   ASIN: B0HDPNNVNY
 *   SKU: (DOLL)
 *   Quantity: 1
 * Expected inserted text: "(DOLL) | 1"
 */
export async function generateSampleAmazonSinglePair(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const options: SampleAmazonPairOptions = {
    asin: 'B0HDPNNVNY',
    sku: 'DOLL',
    qty: 1,
    productTitle: 'Handmade Classic Plush Doll',
    customerName: 'Pooja Sharma',
    city: 'Bangalore',
    pincode: '560034',
    stationCodes: ['STVT', 'MAMA', 'PNUD'],
  };

  await addAmazonShippingLabelPage(doc, options, 0); // Page 1
  await addAmazonInvoicePage(doc, options, 0); // Page 2

  return await doc.save();
}

/**
 * Generates a realistic multi-pair batch Amazon PDF (e.g. 6 pages = 3 pairs)
 * Pair 1: B0HDPNNVNY (DOLL) | 1
 * Pair 2: B07XG45PQR (PAN-OIL) | 2
 * Pair 3: B09KLP1234 (ABC123) | 5
 */
export async function generateSampleAmazonBatch(pairsCount: number = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const sampleConfigs: SampleAmazonPairOptions[] = [
    {
      asin: 'B0HDPNNVNY',
      sku: 'DOLL',
      qty: 1,
      productTitle: 'Handmade Classic Plush Doll',
      customerName: 'Pooja Sharma',
      city: 'Bangalore',
      pincode: '560034',
      stationCodes: ['STVT', 'MAMA', 'PNUD'],
    },
    {
      asin: 'B07XG45PQR',
      sku: 'PAN-OIL',
      qty: 2,
      productTitle: 'Cold Pressed Sesame Pan Oil 500ml',
      customerName: 'Arjun Verma',
      city: 'Mumbai',
      pincode: '400001',
      stationCodes: ['BOM', 'DEL', 'PNUD'],
    },
    {
      asin: 'B09KLP1234',
      sku: 'ABC123',
      qty: 5,
      productTitle: 'Stainless Steel Utility Fastener Pack',
      customerName: 'Rohit Kulkarni',
      city: 'Pune',
      pincode: '411038',
      stationCodes: ['PUN', 'STVT', 'DEL'],
    },
  ];

  for (let i = 0; i < pairsCount; i++) {
    const config = sampleConfigs[i % sampleConfigs.length];
    await addAmazonShippingLabelPage(doc, config, i); // Odd page
    await addAmazonInvoicePage(doc, config, i); // Even page
  }

  return await doc.save();
}

/**
 * Adds an authentic Amazon invoice continuation page (no invoice-start header)
 * containing declarations, tax breakdown, and terms.
 */
export async function addAmazonInvoiceContinuationPage(
  doc: PDFDocument,
  options: SampleAmazonPairOptions,
  subPageNumber: number,
  totalPages: number
) {
  const page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const toBottomUp = (yOffset: number) => A4_HEIGHT - yOffset;

  // Header without "Tax Invoice/Bill of Supply/Cash Memo"
  page.drawText(`Tax Invoice (Continued - Page ${subPageNumber} of ${totalPages})`, {
    x: 40,
    y: toBottomUp(50),
    size: 11,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`Product Details & Tax Summary for SKU (${options.sku})`, {
    x: 40,
    y: toBottomUp(75),
    size: 9.5,
    font: fontRegular,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Qty in this shipment: ${options.qty} Units`, {
    x: 40,
    y: toBottomUp(95),
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('Declaration: The goods sold are intended for end user consumption and not for resale.', {
    x: 40,
    y: toBottomUp(130),
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('This is a computer generated invoice and does not require physical signature.', {
    x: 40,
    y: toBottomUp(150),
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
}

/**
 * Generates a realistic multi-page invoice test PDF matching Section 7 & 32:
 * Page 1: Shipping Label A
 * Page 2: Invoice A START
 * Page 3: Invoice A CONTINUATION (Page 2 of 3)
 * Page 4: Invoice A CONTINUATION (Page 3 of 3)
 * Page 5: Shipping Label B
 * Page 6: Invoice B START
 * Page 7: Invoice B CONTINUATION (Page 2 of 2)
 * Page 8: Shipping Label C
 * Page 9: Invoice C START
 * Total: 9 pages (3 Orders)
 */
export async function generateSampleAmazonMultiPageInvoice(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Order 1: Label A -> Invoice A (Pages 2-4)
  const configA: SampleAmazonPairOptions = {
    asin: 'B0HDPNNVNY',
    sku: 'DOLL',
    qty: 1,
    productTitle: 'Handmade Classic Plush Doll',
    customerName: 'Pooja Sharma',
    city: 'Bangalore',
    pincode: '560034',
    stationCodes: ['STVT', 'MAMA', 'PNUD'],
  };
  await addAmazonShippingLabelPage(doc, configA, 0); // Page 1
  await addAmazonInvoicePage(doc, configA, 0); // Page 2: Start
  await addAmazonInvoiceContinuationPage(doc, configA, 2, 3); // Page 3
  await addAmazonInvoiceContinuationPage(doc, configA, 3, 3); // Page 4

  // Order 2: Label B -> Invoice B (Pages 6-7)
  const configB: SampleAmazonPairOptions = {
    asin: 'B07XG45PQR',
    sku: 'PAN-OIL',
    qty: 2,
    productTitle: 'Cold Pressed Sesame Pan Oil 500ml',
    customerName: 'Arjun Verma',
    city: 'Mumbai',
    pincode: '400001',
    stationCodes: ['BOM', 'DEL', 'PNUD'],
  };
  await addAmazonShippingLabelPage(doc, configB, 1); // Page 5
  await addAmazonInvoicePage(doc, configB, 1); // Page 6: Start
  await addAmazonInvoiceContinuationPage(doc, configB, 2, 2); // Page 7

  // Order 3: Label C -> Invoice C (Page 9)
  const configC: SampleAmazonPairOptions = {
    asin: 'B09KLP1234',
    sku: 'ABC123',
    qty: 5,
    productTitle: 'Stainless Steel Utility Fastener Pack',
    customerName: 'Rohit Kulkarni',
    city: 'Pune',
    pincode: '411038',
    stationCodes: ['PUN', 'STVT', 'DEL'],
  };
  await addAmazonShippingLabelPage(doc, configC, 2); // Page 8
  await addAmazonInvoicePage(doc, configC, 2); // Page 9: Start

  return await doc.save();
}

