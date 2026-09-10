import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleLabelOptions {
  itemCount?: number;
  orderId?: string;
  awbNumber?: string;
  sellerName?: string;
  customerName?: string;
  city?: string;
  state?: string;
  sku?: string;
  amount?: number;
}

/**
 * Draws a realistic vector barcode on the PDF page
 */
function drawBarcode(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  code: string
) {
  // Draw barcode lines with varying standard widths
  let currentX = x;
  const numBars = 50;
  // Pseudorandom deterministic pattern from code string
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const barWidthUnit = width / 70;
  for (let i = 0; i < numBars; i++) {
    const isBar = ((hash * (i + 13) + i * 7) % 10) > 3;
    const barW = isBar ? (((hash + i) % 3) + 1) * barWidthUnit * 0.8 : barWidthUnit * 0.8;
    if (isBar && currentX + barW <= x + width) {
      page.drawRectangle({
        x: currentX,
        y: y,
        width: Math.max(0.75, barW),
        height: height,
        color: rgb(0, 0, 0),
      });
    }
    currentX += barW + barWidthUnit * 0.5;
  }
}

/**
 * Creates a single authentic Meesho Shipping & Invoice Label page on a PDF
 */
export async function createSingleMeeshoLabelPage(
  pdfDoc: PDFDocument,
  options: SampleLabelOptions = {}
) {
  const width = 288; // 4 inches (72 pt/in)
  const height = 432; // 6 inches (72 pt/in)
  const page = pdfDoc.addPage([width, height]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const orderId = options.orderId || `MEE-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const awb = options.awbNumber || `1488${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const seller = options.sellerName || 'Rajwadi Ratna Fashion';
  const customer = options.customerName || 'Aarav Sharma';
  const city = options.city || 'Jaipur';
  const state = options.state || 'Rajasthan';
  const sku = options.sku || 'RR-KURTI-PINK-L';
  const amount = options.amount || 499;
  const itemCount = options.itemCount || 1;

  const margin = 10;
  let curY = height - margin; // 422 pt

  // Outer border of shipping label
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - 2 * margin,
    height: height - 2 * margin,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  // 1. Header: Meesho Logo & Courier Partner
  curY -= 14;
  page.drawText('meesho', {
    x: margin + 6,
    y: curY,
    size: 14,
    font: fontBold,
    color: rgb(0.85, 0.1, 0.45), // Meesho Pink brand color
  });

  page.drawText('Prepaid / Standard', {
    x: margin + 80,
    y: curY + 2,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('XpressBees Surface', {
    x: width - margin - 85,
    y: curY + 2,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 6;
  // Horizontal divider
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 2. Primary Shipping Barcode & AWB
  curY -= 32;
  drawBarcode(page, margin + 20, curY + 10, width - 2 * margin - 40, 22, awb);

  curY -= 2;
  page.drawText(`AWB: ${awb}`, {
    x: width / 2 - 45,
    y: curY,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 6;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 3. Routing Code & Pincode Box
  curY -= 16;
  page.drawText('ROUTING: JAI / W1', {
    x: margin + 6,
    y: curY + 4,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('PIN: 302020', {
    x: width - margin - 65,
    y: curY + 4,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 4;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 4. Customer Address & Seller Information (2 columns)
  const colMid = margin + (width - 2 * margin) * 0.58;
  const addrStartY = curY;

  // Left col: Ship To
  let leftY = addrStartY - 10;
  page.drawText('Ship To (Buyer):', {
    x: margin + 6,
    y: leftY,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  leftY -= 9;
  page.drawText(customer, {
    x: margin + 6,
    y: leftY,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  leftY -= 8;
  page.drawText('Plot 42, Sector 8, Mansarovar', {
    x: margin + 6,
    y: leftY,
    size: 6.5,
    font: font,
    color: rgb(0, 0, 0),
  });
  leftY -= 8;
  page.drawText(`${city}, ${state} - 302020`, {
    x: margin + 6,
    y: leftY,
    size: 6.5,
    font: font,
    color: rgb(0, 0, 0),
  });
  leftY -= 8;
  page.drawText('Phone: 98765*****', {
    x: margin + 6,
    y: leftY,
    size: 6.5,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Right col: Sold By
  let rightY = addrStartY - 10;
  page.drawText('Sold By (Seller):', {
    x: colMid + 6,
    y: rightY,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  rightY -= 9;
  page.drawText(seller, {
    x: colMid + 6,
    y: rightY,
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  rightY -= 8;
  page.drawText('GSTIN: 08AAACR1234F1Z5', {
    x: colMid + 6,
    y: rightY,
    size: 6,
    font: font,
    color: rgb(0, 0, 0),
  });
  rightY -= 8;
  page.drawText('Surat, Gujarat, 395006', {
    x: colMid + 6,
    y: rightY,
    size: 6,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Vertical divider between address columns
  const addrHeight = 52;
  page.drawLine({
    start: { x: colMid, y: addrStartY },
    end: { x: colMid, y: addrStartY - addrHeight },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  curY = addrStartY - addrHeight;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 5. Order & Product Line Box
  curY -= 10;
  page.drawText(`Order ID: ${orderId}`, {
    x: margin + 6,
    y: curY,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Date: 24-Aug-2026`, {
    x: width - margin - 75,
    y: curY,
    size: 7,
    font: font,
    color: rgb(0, 0, 0),
  });

  curY -= 9;
  page.drawText(`SKU: ${sku} | Size: Free Size | Qty: ${itemCount}`, {
    x: margin + 6,
    y: curY,
    size: 7,
    font: font,
    color: rgb(0, 0, 0),
  });

  curY -= 5;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // 6. Tax Invoice Table Header
  curY -= 10;
  page.drawText('TAX INVOICE', {
    x: margin + 6,
    y: curY,
    size: 7.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText('ORIGINAL FOR RECIPIENT', {
    x: width - margin - 100,
    y: curY,
    size: 6,
    font: font,
    color: rgb(0, 0, 0),
  });

  curY -= 5;
  // Table Header bar
  page.drawRectangle({
    x: margin,
    y: curY - 9,
    width: width - 2 * margin,
    height: 9,
    color: rgb(0.92, 0.92, 0.92),
  });

  curY -= 7;
  page.drawText('Description', { x: margin + 4, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('HSN', { x: margin + 70, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Qty', { x: margin + 95, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Gross Amt', { x: margin + 112, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Discount', { x: margin + 145, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Taxable Val', { x: margin + 175, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Taxes', { x: margin + 215, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
  page.drawText('Total (INR)', { x: width - margin - 35, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });

  curY -= 4;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // Table Rows (1 to N items depending on itemCount)
  for (let i = 0; i < itemCount; i++) {
    curY -= 8;
    const itemTitle = i === 0 ? 'Embroidery Ethnic Kurti' : i === 1 ? 'Matching Dupatta Silk' : i === 2 ? 'Leggings Combo Cotton' : `Ethnic Accessory Set #${i + 1}`;
    const itemHsn = '621142';
    const itemRate = Math.round((amount - 40) / itemCount);
    
    page.drawText(itemTitle, { x: margin + 4, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(itemHsn, { x: margin + 70, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText('1', { x: margin + 98, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Rs.${itemRate + 50}`, { x: margin + 115, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Rs.50`, { x: margin + 148, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Rs.${Math.round(itemRate * 0.95)}`, { x: margin + 178, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Rs.${Math.round(itemRate * 0.05)}`, { x: margin + 218, y: curY, size: 5, font: font, color: rgb(0, 0, 0) });
    page.drawText(`Rs.${itemRate}`, { x: width - margin - 32, y: curY, size: 5, font: fontBold, color: rgb(0, 0, 0) });
    
    curY -= 3;
    page.drawLine({
      start: { x: margin, y: curY },
      end: { x: width - margin, y: curY },
      thickness: 0.25,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  // Other Charges row
  curY -= 7;
  page.drawText('Other Charges (Logistics fee & packaging)', {
    x: margin + 4,
    y: curY,
    size: 5,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText('Rs.40.00', {
    x: width - margin - 32,
    y: curY,
    size: 5,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  curY -= 3;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.25,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Invoice Summary & Total Row
  curY -= 8;
  page.drawText('Total (INR):', {
    x: margin + 6,
    y: curY,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  page.drawText(`Rs.${amount}.00`, {
    x: width - margin - 38,
    y: curY,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 4;
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // Exact Meesho Final Invoice Disclaimer (3 Lines)
  curY -= 7;
  page.drawText(
    'Tax is not payable on reverse charge basis. This is a computer generated invoice and does not require signature.',
    {
      x: margin + 4,
      y: curY,
      size: 4.2,
      font: font,
      color: rgb(0.25, 0.25, 0.25),
    }
  );

  curY -= 5.5;
  page.drawText(
    'Other charges are charges that are applicable to your order and include charges for logistics fee (where applicable).',
    {
      x: margin + 4,
      y: curY,
      size: 4.2,
      font: font,
      color: rgb(0.25, 0.25, 0.25),
    }
  );

  curY -= 5.5;
  page.drawText(
    'Includes discounts for your city and/or for online payments (as applicable).',
    {
      x: margin + 4,
      y: curY,
      size: 4.2,
      font: font,
      color: rgb(0.25, 0.25, 0.25),
    }
  );

  curY -= 4;
  // This is the true INVOICE ENDING boundary line!
  page.drawLine({
    start: { x: margin, y: curY },
    end: { x: width - margin, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  // Anything below curY (down to margin = 10 pt) is the safe, untouched white space!
  return {
    invoiceEndingPdfY: curY, // in PDF coordinates from bottom
    invoiceEndingTopY: height - curY, // in standard top-down coordinates
  };
}

/**
 * Generates a complete realistic Meesho Batch PDF with N labels
 */
export async function generateSampleMeeshoPDF(
  count = 1,
  itemCountType: 'single' | 'medium' | 'tall' | 'extremely-tall' | 'mixed' = 'single'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const cities = ['Jaipur', 'Ahmedabad', 'Surat', 'Mumbai', 'Delhi', 'Bengaluru', 'Lucknow', 'Indore', 'Kolkata', 'Hyderabad'];
  const states = ['Rajasthan', 'Gujarat', 'Gujarat', 'Maharashtra', 'Delhi', 'Karnataka', 'Uttar Pradesh', 'Madhya Pradesh', 'West Bengal', 'Telangana'];
  const customers = [
    'Aarav Sharma', 'Pooja Patel', 'Rohan Gupta', 'Neha Verma', 'Vikram Singh',
    'Ananya Das', 'Rahul Joshi', 'Kavita Reddy', 'Deepak Mehta', 'Sneha Iyer'
  ];
  const skus = ['RR-KURTI-PINK-L', 'RR-SAREE-SILK-BL', 'RR-LEHENGA-RED-M', 'RR-ANARKALI-GREEN-XL', 'RR-COTTON-SUIT-S'];

  for (let i = 0; i < count; i++) {
    let items = 1;
    if (itemCountType === 'medium') items = 2;
    else if (itemCountType === 'tall') items = 3;
    else if (itemCountType === 'extremely-tall') items = 6;
    else if (itemCountType === 'mixed') items = (i % 3) + 1;

    const cityIdx = i % cities.length;
    await createSingleMeeshoLabelPage(pdfDoc, {
      itemCount: items,
      orderId: `MEE-2026-${100000 + i * 37}`,
      awbNumber: `1488${8000000000 + i * 1337}`,
      sellerName: 'Rajwadi Ratna Fashion',
      customerName: customers[i % customers.length],
      city: cities[cityIdx],
      state: states[cityIdx],
      sku: skus[i % skus.length],
      amount: 399 + (i % 5) * 150,
    });
  }

  return await pdfDoc.save();
}
