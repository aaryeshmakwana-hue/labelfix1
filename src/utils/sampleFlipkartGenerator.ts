import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SampleFlipkartPageOptions {
  orderId?: string;
  awbNumber?: string;
  carrier?: 'EKART LOGISTICS' | 'DELHIVERY' | 'SHADOWFAX' | 'XPRESSBEES';
  paymentType?: 'PREPAID' | 'COD';
  codAmount?: number;
  routingCode?: string;
  customerName?: string;
  addressLines?: string[];
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  sellerName?: string;
  sellerGstin?: string;
  sku?: string;
  itemDescription?: string;
  qty?: number;
  price?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  isCompact?: boolean;
}

/**
 * Draws a realistic vector Code-128 style barcode
 */
function drawBarcode(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  code: string
) {
  let currentX = x;
  const numBars = 55;
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const barUnit = width / 75;

  for (let i = 0; i < numBars; i++) {
    const isBar = ((hash * (i + 17) + i * 11) % 10) > 3;
    const barW = isBar ? (((hash + i * 3) % 3) + 1) * barUnit * 0.85 : barUnit * 0.85;
    if (isBar && currentX + barW <= x + width) {
      page.drawRectangle({
        x: currentX,
        y: y,
        width: Math.max(0.8, barW),
        height: height,
        color: rgb(0, 0, 0),
      });
    }
    currentX += barW + barUnit * 0.45;
  }
}

/**
 * Draws a realistic vector QR code matrix
 */
function drawVectorQR(
  page: any,
  x: number,
  y: number,
  size: number,
  seedStr: string
) {
  const gridSize = 21;
  const cellSize = size / gridSize;
  const hash = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Background white
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    color: rgb(1, 1, 1),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Helper for QR finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (fx: number, fy: number) => {
    // 7x7 outer square
    page.drawRectangle({
      x: fx,
      y: fy,
      width: cellSize * 7,
      height: cellSize * 7,
      color: rgb(0, 0, 0),
    });
    // 5x5 inner white
    page.drawRectangle({
      x: fx + cellSize,
      y: fy + cellSize,
      width: cellSize * 5,
      height: cellSize * 5,
      color: rgb(1, 1, 1),
    });
    // 3x3 center black
    page.drawRectangle({
      x: fx + cellSize * 2,
      y: fy + cellSize * 2,
      width: cellSize * 3,
      height: cellSize * 3,
      color: rgb(0, 0, 0),
    });
  };

  // Top-left
  drawFinder(x, y + size - cellSize * 7);
  // Top-right
  drawFinder(x + size - cellSize * 7, y + size - cellSize * 7);
  // Bottom-left
  drawFinder(x, y);

  // Random data cells inside QR (excluding finders)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const isTL = r < 8 && c < 8;
      const isTR = r < 8 && c >= gridSize - 8;
      const isBL = r >= gridSize - 8 && c < 8;
      if (isTL || isTR || isBL) continue;

      const isBlack = ((hash * (r * 13 + c * 7 + 5)) % 11) > 4;
      if (isBlack) {
        page.drawRectangle({
          x: x + c * cellSize,
          y: y + (gridSize - 1 - r) * cellSize,
          width: cellSize + 0.1,
          height: cellSize + 0.1,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
}

/**
 * Creates a single authentic Flipkart A4 page with Shipping Label at the top
 * and Tax Invoice below the dividing line
 */
export async function createSingleFlipkartPage(
  pdfDoc: PDFDocument,
  options: SampleFlipkartPageOptions = {}
): Promise<void> {
  // A4 Standard Dimensions in PostScript points: 595.28 x 841.89 pt
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const carrier = options.carrier || 'EKART LOGISTICS';
  const paymentType = options.paymentType || 'PREPAID';
  const codAmount = options.codAmount || 1299;
  const routingCode = options.routingCode || 'BLR/WFD';
  const awbNumber = options.awbNumber || 'FMPP0928374615';
  const orderId = options.orderId || 'OD302918273645123000';
  const customerName = options.customerName || 'Rahul Sharma';
  const addressLines = options.addressLines || [
    'Flat 402, Sunshine Heights, 12th Main Road',
    'Indiranagar, Near Metro Station',
    'Bangalore, Karnataka - 560038',
  ];
  const city = options.city || 'Bangalore';
  const state = options.state || 'Karnataka';
  const pincode = options.pincode || '560038';
  const phone = options.phone || '9876543210';
  const sellerName = options.sellerName || 'CloudRetailers India Pvt Ltd';
  const sellerGstin = options.sellerGstin || '29AABCU9603R1ZM';
  const sku = options.sku || 'TS-COT-BLK-L';
  const itemDescription = options.itemDescription || 'Men Solid Pure Cotton Round Neck T-Shirt (Black, L)';
  const qty = options.qty || 1;
  const price = options.price || 499;
  const invoiceNumber = options.invoiceNumber || 'FK-INV-2026-90218';
  const invoiceDate = options.invoiceDate || '02-09-2026';

  // --------------------------------------------------------------------------
  // 1. FLIPKART SHIPPING LABEL REGION (Top Section)
  // Dynamic height based on address lines length
  // --------------------------------------------------------------------------
  const isCompact = options.isCompact || false;
  const marginX = isCompact ? 50 : 24;
  const labelWidth = isCompact ? 380 : (PAGE_WIDTH - marginX * 2);
  const labelTop = PAGE_HEIGHT - (isCompact ? 32 : 24);

  // Address lines determine label height dynamically
  const addressBlockHeight = addressLines.length * 12 + 10;
  const labelHeight = isCompact ? 245 : (270 + addressBlockHeight);
  const labelBottom = labelTop - labelHeight;

  // Outer Border Box of Flipkart Shipping Label
  page.drawRectangle({
    x: marginX,
    y: labelBottom,
    width: labelWidth,
    height: labelHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1.5,
  });

  let curY = labelTop - 18;

  // Header Row: Carrier | COD/PREPAID | Ordered Through Flipkart
  page.drawText(carrier, {
    x: marginX + 14,
    y: curY,
    size: 13,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const payText = paymentType === 'COD' ? `COD : Rs. ${codAmount.toFixed(2)}` : 'PREPAID';
  page.drawText(payText, {
    x: marginX + 220,
    y: curY,
    size: 12,
    font: fontBold,
    color: paymentType === 'COD' ? rgb(0.8, 0.1, 0.1) : rgb(0, 0, 0),
  });

  page.drawText('Ordered Through : Flipkart', {
    x: marginX + labelWidth - 160,
    y: curY + 1,
    size: 9.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 10;
  // Header divider line
  page.drawLine({
    start: { x: marginX, y: curY },
    end: { x: marginX + labelWidth, y: curY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  curY -= 16;

  // AWB Barcode & Routing code
  page.drawText(`AWB: ${awbNumber}`, {
    x: marginX + 14,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Routing: ${routingCode}`, {
    x: marginX + labelWidth - 130,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 38;

  // AWB Barcode
  drawBarcode(page, marginX + 14, curY, 320, 32, awbNumber);

  // Machine-Readable QR Code on the right side
  const qrSize = 70;
  drawVectorQR(page, marginX + labelWidth - qrSize - 16, curY - 24, qrSize, `${awbNumber}_${orderId}`);

  curY -= 16;
  // Divider below barcode
  page.drawLine({
    start: { x: marginX, y: curY },
    end: { x: marginX + labelWidth - qrSize - 26, y: curY },
    thickness: 0.75,
    color: rgb(0.4, 0.4, 0.4),
  });

  curY -= 14;

  // Shipping Address Block
  page.drawText('Ship to / Customer Address:', {
    x: marginX + 14,
    y: curY,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  curY -= 12;
  page.drawText(customerName, {
    x: marginX + 14,
    y: curY,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  for (const line of addressLines) {
    curY -= 11;
    page.drawText(line, {
      x: marginX + 14,
      y: curY,
      size: 8.5,
      font: font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  curY -= 11;
  page.drawText(`Phone: ${phone} | City: ${city} | PIN: ${pincode}`, {
    x: marginX + 14,
    y: curY,
    size: 8.5,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 14;
  // Divider between address and seller info
  page.drawLine({
    start: { x: marginX, y: curY },
    end: { x: marginX + labelWidth, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  curY -= 12;

  // Seller / Sold By details
  page.drawText(`Sold By: ${sellerName}`, {
    x: marginX + 14,
    y: curY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`GSTIN: ${sellerGstin} | State: ${state}`, {
    x: marginX + 260,
    y: curY,
    size: 8,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  curY -= 14;
  // Divider between seller and SKU
  page.drawLine({
    start: { x: marginX, y: curY },
    end: { x: marginX + labelWidth, y: curY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  curY -= 12;

  // Order ID & Product Table
  page.drawText(`Order ID: ${orderId}`, {
    x: marginX + 14,
    y: curY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`HBD: 03-Sep-2026 | CPD: 04-Sep-2026`, {
    x: marginX + labelWidth - 190,
    y: curY,
    size: 8,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  curY -= 12;

  // SKU / Item description
  const shortDesc = itemDescription.length > 55 ? itemDescription.substring(0, 52) + '...' : itemDescription;
  page.drawText(`SKU: ${sku} | ${shortDesc} | Qty: ${qty}`, {
    x: marginX + 14,
    y: curY,
    size: 8,
    font: font,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 12;

  // Compliance statement at the very bottom of the shipping label
  page.drawText('Use Transparent Packaging | Not for resale | Handle with care', {
    x: marginX + 14,
    y: curY,
    size: 7.5,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Solid Horizontal Boundary Line ending the shipping label
  page.drawLine({
    start: { x: marginX, y: labelBottom },
    end: { x: marginX + labelWidth, y: labelBottom },
    thickness: 1.5,
    color: rgb(0, 0, 0),
  });

  // --------------------------------------------------------------------------
  // 2. TAX INVOICE REGION (Bottom Section — To be cropped out)
  // --------------------------------------------------------------------------
  let invY = labelBottom - 26;

  page.drawText('TAX INVOICE', {
    x: marginX + 14,
    y: invY,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Invoice No: ${invoiceNumber} | Date: ${invoiceDate}`, {
    x: marginX + 220,
    y: invY + 1,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  invY -= 16;
  page.drawLine({
    start: { x: marginX, y: invY },
    end: { x: marginX + labelWidth, y: invY },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  invY -= 14;

  // Billing Address & Shipping Address in Invoice format
  page.drawText('Billing Address:', {
    x: marginX + 14,
    y: invY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page.drawText('Shipping Address:', {
    x: marginX + 280,
    y: invY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  invY -= 11;
  page.drawText(customerName, { x: marginX + 14, y: invY, size: 8, font });
  page.drawText(customerName, { x: marginX + 280, y: invY, size: 8, font });

  invY -= 10;
  page.drawText(addressLines[0] || '12th Main Road', { x: marginX + 14, y: invY, size: 7.5, font });
  page.drawText(addressLines[0] || '12th Main Road', { x: marginX + 280, y: invY, size: 7.5, font });

  invY -= 10;
  page.drawText(`${city}, ${state} - ${pincode}`, { x: marginX + 14, y: invY, size: 7.5, font });
  page.drawText(`${city}, ${state} - ${pincode}`, { x: marginX + 280, y: invY, size: 7.5, font });

  invY -= 16;

  // Invoice Table Header Box
  page.drawRectangle({
    x: marginX,
    y: invY - 14,
    width: labelWidth,
    height: 16,
    color: rgb(0.92, 0.92, 0.92),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.75,
  });

  page.drawText('Sl No', { x: marginX + 6, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('Description of Goods', { x: marginX + 40, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('HSN', { x: marginX + 240, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('Qty', { x: marginX + 290, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('Gross Amount', { x: marginX + 325, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('Taxable Value', { x: marginX + 400, y: invY - 10, size: 7.5, font: fontBold });
  page.drawText('Total (INR)', { x: marginX + 480, y: invY - 10, size: 7.5, font: fontBold });

  invY -= 28;

  // Invoice Table Row 1
  page.drawText('1', { x: marginX + 10, y: invY, size: 7.5, font });
  page.drawText(shortDesc, { x: marginX + 40, y: invY, size: 7.5, font });
  page.drawText('61091000', { x: marginX + 240, y: invY, size: 7.5, font });
  page.drawText(qty.toString(), { x: marginX + 295, y: invY, size: 7.5, font });
  page.drawText(`Rs. ${price.toFixed(2)}`, { x: marginX + 330, y: invY, size: 7.5, font });
  const taxable = price / 1.18;
  page.drawText(`Rs. ${taxable.toFixed(2)}`, { x: marginX + 405, y: invY, size: 7.5, font });
  page.drawText(`Rs. ${price.toFixed(2)}`, { x: marginX + 485, y: invY, size: 7.5, font: fontBold });

  invY -= 20;
  // Invoice Total Box
  page.drawRectangle({
    x: marginX,
    y: invY - 10,
    width: labelWidth,
    height: 18,
    color: rgb(0.96, 0.96, 0.96),
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.75,
  });

  page.drawText('Total Amount in Words: Four Hundred Ninety Nine Rupees Only', {
    x: marginX + 8,
    y: invY - 6,
    size: 7.5,
    font,
  });

  page.drawText(`Total Amount: Rs. ${price.toFixed(2)}`, {
    x: marginX + 400,
    y: invY - 6,
    size: 8,
    font: fontBold,
  });

  invY -= 36;

  // Tax Breakdown & Seller Registered Address
  page.drawText('Tax Summary: CGST (9%): Rs. 38.06 | SGST (9%): Rs. 38.06 | Total Tax: Rs. 76.12', {
    x: marginX + 8,
    y: invY,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  invY -= 14;
  page.drawText(`Seller Registered Office: ${sellerName}, Plot 12, Industrial Area, Sector 58, Gurgaon, Haryana - 122001`, {
    x: marginX + 8,
    y: invY,
    size: 7,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Authorized Signatory Block
  page.drawText('For CloudRetailers India Pvt Ltd:', {
    x: marginX + labelWidth - 180,
    y: invY - 24,
    size: 7.5,
    font: fontBold,
  });

  page.drawLine({
    start: { x: marginX + labelWidth - 180, y: invY - 44 },
    end: { x: marginX + labelWidth - 20, y: invY - 44 },
    thickness: 0.75,
    color: rgb(0, 0, 0),
  });

  page.drawText('Authorized Signatory', {
    x: marginX + labelWidth - 140,
    y: invY - 54,
    size: 7.5,
    font,
  });

  // Invoice Footer Disclaimer
  page.drawText('This is a computer generated invoice and does not require physical signature.', {
    x: marginX + 14,
    y: 30,
    size: 7,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
}

/**
 * Generates an authentic multi-page or single-page Flipkart PDF
 * suitable for testing the crop engine
 */
export async function generateSampleFlipkartPDF(
  count: number = 1,
  variation: 'standard' | 'multi' | 'long-address' | 'short-address' | 'tall' | 'mixed' | 'compact' = 'standard'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const sampleDatasets: SampleFlipkartPageOptions[] = [
    {
      orderId: 'OD302918273645123001',
      awbNumber: 'FMPP0928374615',
      carrier: 'EKART LOGISTICS',
      paymentType: 'PREPAID',
      routingCode: 'BLR/WFD',
      customerName: 'Rahul Sharma',
      addressLines: [
        'Flat 402, Sunshine Heights, 12th Main Road',
        'Indiranagar, Near Metro Station',
        'Bangalore, Karnataka - 560038',
      ],
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      phone: '9876543210',
      sku: 'TS-COT-BLK-L',
      itemDescription: 'Men Solid Pure Cotton Round Neck T-Shirt (Black, L)',
      qty: 1,
      price: 499,
      invoiceNumber: 'FK-INV-2026-90218',
    },
    {
      orderId: 'OD302918273645123002',
      awbNumber: 'FMPC8827361928',
      carrier: 'EKART LOGISTICS',
      paymentType: 'COD',
      codAmount: 1499,
      routingCode: 'DEL/OKH',
      customerName: 'Pooja Verma',
      addressLines: [
        'House No 72, Block C, Pocket 4',
        'Sector 18, Rohini',
        'New Delhi, Delhi - 110085',
      ],
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110085',
      phone: '9811223344',
      sku: 'KURTI-EMB-BLUE-M',
      itemDescription: 'Women Embroidered Anarkali Kurti With Dupatta (Navy Blue, M)',
      qty: 1,
      price: 1499,
      invoiceNumber: 'FK-INV-2026-90219',
    },
    {
      orderId: 'OD302918273645123003',
      awbNumber: 'FMPP7712349876',
      carrier: 'DELHIVERY',
      paymentType: 'PREPAID',
      routingCode: 'BOM/AND',
      customerName: 'Amitabh Joshi',
      addressLines: [
        'Apt 14B, Sea View Tower, Marine Drive',
        'Opposite Wankhede Stadium, Churchgate',
        'Mumbai, Maharashtra - 400020',
      ],
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400020',
      phone: '9765432109',
      sku: 'JEANS-SLIM-32',
      itemDescription: 'Men Slim Fit Dark Wash Stretch Denim Jeans (Size 32)',
      qty: 1,
      price: 999,
      invoiceNumber: 'FK-INV-2026-90220',
    },
    {
      orderId: 'OD302918273645123004',
      awbNumber: 'FMPC5544332211',
      carrier: 'SHADOWFAX',
      paymentType: 'COD',
      codAmount: 849,
      routingCode: 'HYD/HIM',
      customerName: 'Kavitha Reddy',
      addressLines: [
        'Plot 88, Road No 3, Jubilee Hills',
        'Behind Apollo Hospital',
        'Hyderabad, Telangana - 500033',
      ],
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      phone: '9988776655',
      sku: 'SAREE-SILK-RED',
      itemDescription: 'Traditional Kanjeevaram Silk Blend Saree With Blouse Piece',
      qty: 1,
      price: 849,
      invoiceNumber: 'FK-INV-2026-90221',
    },
    {
      orderId: 'OD302918273645123005',
      awbNumber: 'FMPP3322119988',
      carrier: 'EKART LOGISTICS',
      paymentType: 'PREPAID',
      routingCode: 'MAA/MYL',
      customerName: 'Suresh Ramanathan',
      addressLines: [
        'Door No 18, 2nd Main Road, R.A. Puram',
        'Chennai, Tamil Nadu - 600028',
      ],
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600028',
      phone: '9444112233',
      sku: 'SHIRT-COT-WHT-40',
      itemDescription: 'Men Classic White Formal Slim Fit Cotton Shirt (Size 40)',
      qty: 1,
      price: 699,
      invoiceNumber: 'FK-INV-2026-90222',
    },
    {
      orderId: 'OD302918273645123006',
      awbNumber: 'FMPC9988776655',
      carrier: 'XPRESSBEES',
      paymentType: 'COD',
      codAmount: 2199,
      routingCode: 'CCU/SLT',
      customerName: 'Ananya Mukherjee',
      addressLines: [
        'Flat 5C, Greenwood Residency, Block AA',
        'Action Area 1, New Town, Rajarhat',
        'Kolkata, West Bengal - 700156',
      ],
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700156',
      phone: '9830112233',
      sku: 'WATCH-CHRONO-SLV',
      itemDescription: 'Stainless Steel Water Resistant Analog Chronograph Watch',
      qty: 1,
      price: 2199,
      invoiceNumber: 'FK-INV-2026-90223',
    },
  ];

  if (variation === 'long-address') {
    await createSingleFlipkartPage(pdfDoc, {
      ...sampleDatasets[0],
      customerName: 'Dr. Subramanian Balakrishna Rao',
      addressLines: [
        'Apartment 1004, 10th Floor, Tower Emerald B',
        'Prestige Shantiniketan Commercial & Residential Complex',
        'ITPB Main Road, Near Forum Shantiniketan Mall',
        'Whitefield, East Zone, Bangalore Rural District',
        'Landmark: Opposite Brigade Metropolis Gate 2',
      ],
    });
  } else if (variation === 'short-address') {
    await createSingleFlipkartPage(pdfDoc, {
      ...sampleDatasets[0],
      customerName: 'M. Ali',
      addressLines: ['Shop 4, Main Bazaar, Agra - 282001'],
    });
  } else if (variation === 'tall') {
    await createSingleFlipkartPage(pdfDoc, {
      ...sampleDatasets[0],
      addressLines: [
        'Villa 24, Palm Meadows Gated Community',
        'Ramagondanahalli, Varthur Road, Whitefield',
        'Bangalore, Karnataka - 560066',
      ],
    });
  } else if (variation === 'compact') {
    await createSingleFlipkartPage(pdfDoc, {
      ...sampleDatasets[0],
      isCompact: true,
      addressLines: [
        'House 12, Ground Floor, Sector 15',
        'Gurugram, Haryana - 122001',
      ],
    });
  } else {
    // Standard or multi-page
    const totalToGenerate = Math.max(1, count);
    for (let i = 0; i < totalToGenerate; i++) {
      const data = sampleDatasets[i % sampleDatasets.length];
      await createSingleFlipkartPage(pdfDoc, {
        ...data,
        orderId: `OD30291827364512300${i + 1}`,
        awbNumber: `FMPP${String(9000000000 + i * 111111).substring(0, 10)}`,
      });
    }
  }

  return await pdfDoc.save();
}
