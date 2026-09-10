import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Store,
  Crop,
  Layers,
  Printer,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Search,
  ArrowRight,
  ChevronDown,
  Info,
} from 'lucide-react';
import { AppRoute } from '../utils/router';

interface GuidesPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface GuideItem {
  id: string;
  title: string;
  category: 'meesho' | 'flipkart' | 'amazon' | 'printing' | 'troubleshooting';
  summary: string;
  readTime: string;
  relatedTool: {
    name: string;
    route: AppRoute;
  };
  directAnswer: string;
  steps: string[];
  checks: string[];
  mistakes: string[];
  tips: string[];
  faqs: { q: string; a: string }[];
}

export const GUIDES: GuideItem[] = [
  {
    id: 'meesho-promotional-labels',
    title: 'Meesho Promotional Labels: Complete Guide',
    category: 'meesho',
    summary: 'How to add store promotional messages and customer review QR codes to Meesho shipping labels without barcode interference.',
    readTime: '4 min read',
    relatedTool: {
      name: 'Meesho Promotional Label',
      route: 'meesho-promotional-label',
    },
    directAnswer:
      'Adding promotional notes and store review QR codes to Meesho labels turns standard shipping paperwork into customer re-engagement. The critical requirement is strict barcode clearance: promotional text and QR vectors must only sit within verified dead whitespace below the shipping label and invoice table, never overlapping the tracking AWB or carrier barcodes.',
    steps: [
      'Download your unedited shipping label PDF batch from Meesho Supplier Panel (Orders → Ready to Ship → Download Labels).',
      'In LabelFix, configure your Store Name and public Meesho store catalog link once under Store Settings.',
      'Upload the Meesho PDF file into the Meesho Promotional Label tool. The engine automatically inspects each page structure.',
      'The multi-stage layout detector calculates invoice boundaries, table endpoints, and legal line markers.',
      'Preview the generated 4×6 inch label to confirm your store QR code and custom message fit neatly below all official courier data.',
      'Click "Download Processed PDF" or "Print All" to produce 4×6 inch thermal labels ready for thermal printers.',
    ],
    checks: [
      'Check that the carrier barcode (Shadowfax, Delhivery, Xpressbees, etc.) is fully visible with crisp black edges.',
      'Verify that the QR code test-scans accurately using any smartphone camera app to your Meesho shop link.',
      'Ensure the customer delivery address and order item summary remain unaltered and legible.',
    ],
    mistakes: [
      'Resizing or distorting the PDF in photo editing tools before uploading, which blurs carrier barcodes.',
      'Trying to put lengthy paragraphs into the message band, which forces font sizes down.',
      'Using a private supplier admin URL instead of the public customer-facing store link.',
    ],
    tips: [
      'Keep promotional phrases short and encouraging: "Thank you for shopping! Scan to follow our store & rate 5 stars."',
      'Use high-contrast thermal settings enabled by default in LabelFix for maximum barcode scanner readability.',
    ],
    faqs: [
      {
        q: 'Will courier delivery agents reject the parcel if there is a QR code at the bottom?',
        a: 'No. Logistics partners scan the top and middle courier barcode / AWB section. As long as barcodes and address blocks are unobstructed with standard quiet margins, couriers process the package normally.',
      },
      {
        q: 'Does this tool support batch Meesho PDFs with multiple pages?',
        a: 'Yes, LabelFix processes multi-label batches page-by-page while preserving exact 1:1 vector clarity.',
      },
    ],
  },
  {
    id: 'prepare-meesho-shipping-labels',
    title: 'How to Prepare Meesho Shipping Labels for Printing',
    category: 'meesho',
    summary: 'Step-by-step workflow to format Meesho seller labels for 4×6 inch thermal label printers.',
    readTime: '3 min read',
    relatedTool: {
      name: 'Meesho Promotional Label',
      route: 'meesho-promotional-label',
    },
    directAnswer:
      'Meesho generates shipping labels as standard PDF documents. To print them properly on 4×6 inch (100×150 mm) thermal rolls without awkward scaling or cropped edges, use a specialized label tool to standardize page geometry and ensure vector barcode clarity.',
    steps: [
      'Log in to Meesho Supplier Hub and navigate to Orders → Ready to Ship.',
      'Select orders and download the combined Label PDF.',
      'Upload the PDF directly into LabelFix Meesho Promotional Label tool.',
      'Review the real-time preview page to ensure correct orientation and margin positioning.',
      'Select your thermal printer (TVS, TSC, Zebra, Rollo, Xprinter) in the print dialog with Paper Size set to 4×6" (100×150mm) and Scale set to 100% (Actual Size).',
    ],
    checks: [
      'Confirm paper dimensions in printer driver are set to 4×6 inches (101.6 × 152.4 mm).',
      'Verify that printing density is set to Dark / Normal, avoiding washed out barcodes.',
      'Check that margins are set to "None" in the print dialog to prevent double margins.',
    ],
    mistakes: [
      'Selecting "Fit to Printable Area" which shrinks the label and adds unwanted white borders.',
      'Printing from screenshots or low-resolution image files instead of the native PDF.',
    ],
    tips: [
      'Always clean your thermal printer printhead with isopropyl alcohol weekly to avoid white streaks through tracking barcodes.',
    ],
    faqs: [
      {
        q: 'Can I print these labels on an ordinary A4 desktop printer?',
        a: 'Yes, but 4×6 thermal roll printers are much faster and do not require expensive ink or ribbon cartridges.',
      },
    ],
  },
  {
    id: 'flipkart-shipping-label-crop',
    title: 'Flipkart Shipping Label Crop Guide',
    category: 'flipkart',
    summary: 'Mastering the dedicated crop workflow for Flipkart shipping labels to separate tax invoices from shipping labels.',
    readTime: '4 min read',
    relatedTool: {
      name: 'Flipkart Label Crop',
      route: 'flipkart-label-crop',
    },
    directAnswer:
      'Flipkart shipping manifests frequently combine the shipping label and buyer tax invoice onto a single A4 page. Thermal 4×6 label printers only need the shipping label portion. The Flipkart Label Crop tool cleanly extracts the shipping label geometry without raster degradation, omitting unnecessary invoice clutter.',
    steps: [
      'Download your shipping label batch from Flipkart Seller Hub (Orders → Active → Generate Labels).',
      'Open the Flipkart Label Crop tool in LabelFix.',
      'Drop your Flipkart PDF onto the upload surface. The tool automatically analyzes page dimensions.',
      'Review the auto-detected crop box surrounding the shipping label. Adjust handles if custom boundaries are required.',
      'Apply the crop and click "Process All Labels" for multi-page batches.',
      'Download the cropped 4×6 PDF or send directly to your thermal printer.',
    ],
    checks: [
      'Confirm that the entire Ekart / carrier routing barcode and tracking ID are inside the crop area.',
      'Verify that the return address and buyer address blocks are not cut off at the perimeter.',
      'Ensure the invoice section is excluded so no thermal paper is wasted.',
    ],
    mistakes: [
      'Dragging the crop boundaries too tightly against the barcode quiet zones.',
      'Using an image screen capture instead of the original PDF download.',
    ],
    tips: [
      'LabelFix remembers your manual crop coordinate preferences across sessions via local browser storage.',
      'Batch processing easily handles 90+ Flipkart labels in a single swift execution.',
    ],
    faqs: [
      {
        q: 'Does cropping reduce the print sharpness of the barcode?',
        a: 'No. LabelFix operates on vector PDF paths using pdf-lib, preserving pristine 1:1 vector sharpness.',
      },
    ],
  },
  {
    id: 'prepare-flipkart-labels-printing',
    title: 'How to Prepare Flipkart Labels for Printing',
    category: 'flipkart',
    summary: 'Optimal printer settings and alignment guidelines for Flipkart thermal labels.',
    readTime: '3 min read',
    relatedTool: {
      name: 'Flipkart Label Crop',
      route: 'flipkart-label-crop',
    },
    directAnswer:
      'Preparing Flipkart labels requires separating the shipping label from the invoice and configuring your thermal printer driver for 100×150 mm label rolls with exact 1:1 scale.',
    steps: [
      'Upload the raw Flipkart PDF into LabelFix Flipkart Label Crop.',
      'Inspect the first page preview to ensure shipping details and barcodes are centered in the 4×6 frame.',
      'Process and download the cropped batch.',
      'Open the downloaded file in your browser or Adobe Acrobat and press Ctrl+P (Cmd+P on Mac).',
      'Select your 4×6 thermal printer model and verify Scale is set to 100%.',
    ],
    checks: [
      'Carrier tracking code and routing numbers must be completely unobstructed.',
      'Thermal label roll should be calibrated with gap sensor before large batch prints.',
    ],
    mistakes: [
      'Printing the entire A4 sheet onto 4×6 paper, which shrinks the text until barcodes become unscannable.',
    ],
    tips: [
      'Calibrate your printer media sensor by holding down the feed button until the light flashes twice.',
    ],
    faqs: [
      {
        q: 'What should I do with the tax invoice if I only print the shipping label?',
        a: 'Flipkart maintains electronic invoices in the seller portal. If physical invoices are mandatory for your category, print the invoice pages separately on standard paper.',
      },
    ],
  },
  {
    id: 'amazon-sku-quantity-guide',
    title: 'Amazon Shipping Label SKU and Quantity Guide',
    category: 'amazon',
    summary: 'How to pair Amazon shipping labels with invoices and display SKU & Quantity on the label.',
    readTime: '4 min read',
    relatedTool: {
      name: 'Amazon Label Tool',
      route: 'amazon-label-crop',
    },
    directAnswer:
      'Amazon Easy Ship orders often group the shipping label and multi-page tax invoices sequentially. Packing staff need to know which item and quantity belong in the box without flipping through invoice papers. LabelFix extracts SKU and Quantity details directly from paired invoice text and prints formatted (SKU) | Qty text safely into the label whitespace band.',
    steps: [
      'Download your order documents from Amazon Seller Central (Manage Orders → Print Packing Slips & Shipping Labels).',
      'Upload the Amazon PDF to the Amazon Label Tool in LabelFix.',
      'The engine automatically detects label pages, pairs corresponding invoice pages, and extracts SKU names and quantities.',
      'Review the batch summary table showing Order ID, paired invoice count, and extracted SKU details.',
      'Inspect the preview to see the formatted SKU text positioned inside the designated horizontal blank band.',
      'Download or print the prepared label batch. Invoices are automatically omitted from the label print stream.',
    ],
    checks: [
      'Ensure the SKU matches the physical inventory being packaged.',
      'Confirm the quantity number matches multi-unit orders (e.g. Qty: 2).',
      'Check that the text does not touch the Amazon carrier barcode or address lines.',
    ],
    mistakes: [
      'Manually writing SKUs with marker pens, which wastes warehouse fulfillment time and causes shipping errors.',
      'Uploading scanned invoice images where text cannot be parsed by text extractors.',
    ],
    tips: [
      'The Amazon tool preserves original Amazon page dimensions while excluding duplicate invoice sheets.',
    ],
    faqs: [
      {
        q: 'What if an order has multiple different SKUs?',
        a: 'LabelFix extracts all unique SKU items from the paired invoice and lists them cleanly separated by commas or pipes.',
      },
    ],
  },
  {
    id: 'prepare-amazon-shipping-labels',
    title: 'How to Prepare Amazon Shipping Labels for Printing',
    category: 'amazon',
    summary: 'Best practices for Amazon Easy Ship and Self-Ship label formatting.',
    readTime: '3 min read',
    relatedTool: {
      name: 'Amazon Label Tool',
      route: 'amazon-label-crop',
    },
    directAnswer:
      'To prepare Amazon labels efficiently, download combined PDFs from Seller Central and use LabelFix to filter out invoice pages while stamping fulfillment SKUs onto the labels for warehouse pickers.',
    steps: [
      'Export order labels from Amazon Seller Central in PDF format.',
      'Process the batch in LabelFix Amazon Label Tool.',
      'Check the page count reduction (e.g. 50 orders reduced from 100 pages to 50 label pages).',
      'Send to your thermal printer with 1:1 scaling.',
    ],
    checks: [
      'Verify that the Easy Ship tracking barcode has clean contrast.',
      'Check order numbers match package contents.',
    ],
    mistakes: [
      'Manually deleting invoice pages in PDF editors one by one.',
    ],
    tips: [
      'Use the Amazon batch summary cards to cross-reference total units before packing.',
    ],
    faqs: [
      {
        q: 'Does this work for Amazon FBA inbound pallet labels?',
        a: 'This tool is specifically optimized for Amazon Easy Ship customer fulfillment labels and invoices.',
      },
    ],
  },
  {
    id: 'print-ecommerce-shipping-labels',
    title: 'How to Print Ecommerce Shipping Labels',
    category: 'printing',
    summary: 'Comprehensive hardware, driver, paper, and resolution guide for thermal shipping label printers.',
    readTime: '5 min read',
    relatedTool: {
      name: 'All Tools',
      route: 'tools',
    },
    directAnswer:
      'Thermal direct printers (203 DPI standard) heat chemically treated paper rolls to produce labels without liquid ink or toner. For reliable delivery scans, calibrate sensor alignment, set 4×6 inch (100×150 mm) page dimensions, and disable margin offsets.',
    steps: [
      'Install the official manufacturer driver for your thermal printer (Zebra, TSC, TVS, Rollo, Xprinter, Citizen).',
      'Under Windows / Mac printer preferences, set Default Paper Size to "4x6" or "100x150mm".',
      'Set Print Density / Darkness to approximately 10–12 out of 15 for deep black barcodes.',
      'Set Print Speed to 4–5 inches per second to prevent jitter.',
      'When printing from the browser, always set Margins to "None" and Scale to "100%" or "Actual Size".',
    ],
    checks: [
      'Barcode vertical lines must be razor-sharp with no bleeding or fuzzy edges.',
      'Label content must stop at least 3 mm before each paper edge.',
      'Tear-off position should sit cleanly on the roll perforation.',
    ],
    mistakes: [
      'Leaving Scale on "Fit to Page", which introduces scaling artifacts and blurs 1D barcodes.',
      'Using low-grade thermal paper that fades in transit under heat or moisture.',
    ],
    tips: [
      'Test your printed barcode with a standard handheld laser scanner or smartphone scanner before shipping large batches.',
    ],
    faqs: [
      {
        q: 'Why does my printer spit out an extra blank label after every print?',
        a: 'This happens when the page height in your computer driver (e.g. 6.2 inches) exceeds the physical paper label height (6 inches). Match the driver height exactly to 6.00 inches (152.4 mm).',
      },
    ],
  },
  {
    id: 'supported-pdf-files',
    title: 'Supported PDF Files and Common Problems',
    category: 'troubleshooting',
    summary: 'Understanding valid PDF structures, encrypted files, vector formats, and compatibility.',
    readTime: '4 min read',
    relatedTool: {
      name: 'All Tools',
      route: 'tools',
    },
    directAnswer:
      'LabelFix is engineered to parse native vector PDF files exported directly from official ecommerce seller portals. Scanned PDFs, password-protected files, or documents modified in photo editors lack selectable vector paths and will fail parsing.',
    steps: [
      'Ensure your file was downloaded directly from Meesho, Flipkart, or Amazon seller portals.',
      'Do not print-to-image or convert the file to JPEG before uploading.',
      'Ensure the PDF file is not password-encrypted.',
      'Keep batches within reasonable sizes (up to 100 pages per file recommended for smooth in-browser performance).',
    ],
    checks: [
      'Check file extension is ".pdf".',
      'Verify you can highlight text inside the file with your mouse cursor.',
    ],
    mistakes: [
      'Uploading photos taken of computer monitors.',
      'Uploading corrupted partial downloads.',
    ],
    tips: [
      'If a download gets interrupted from your marketplace portal, re-download the batch before processing.',
    ],
    faqs: [
      {
        q: 'Why does a password-protected PDF fail to load?',
        a: 'For security and client-side privacy, LabelFix does not crack or store passwords. Remove the password using your original software before uploading.',
      },
    ],
  },
  {
    id: 'shipping-label-troubleshooting',
    title: 'Shipping Label PDF Troubleshooting Guide',
    category: 'troubleshooting',
    summary: 'Fast fixes for blank pages, cut-off barcodes, blurry text, and printer offset issues.',
    readTime: '4 min read',
    relatedTool: {
      name: 'All Tools',
      route: 'tools',
    },
    directAnswer:
      'Almost all label printing issues stem from one of three factors: incorrect browser print scaling, misaligned thermal printer media sensors, or low darkness settings. Following these standard fixes resolves 99% of label defects.',
    steps: [
      'If output is offset to one side: re-run printer hardware calibration (press and hold feed button).',
      'If barcodes appear squished or clipped: in browser print dialog, set Margins to None and Scale to 100%.',
      'If thermal print is too faint: increase Darkness / Density setting in your operating system printer properties.',
      'If text overlaps: verify you selected the correct marketplace tool for your specific PDF type.',
    ],
    checks: [
      'Look at the on-screen preview in LabelFix: if preview looks clean, the issue is downstream in printer driver settings.',
    ],
    mistakes: [
      'Using uncleaned thermal printheads with dust buildup.',
    ],
    tips: [
      'Always test print single-page samples before running 100+ label batches.',
    ],
    faqs: [
      {
        q: 'Why did my printer output completely blank labels?',
        a: 'Ensure your thermal paper roll is facing the right way (coated side up touching the thermal printhead), and that you are using direct thermal paper rather than thermal transfer paper requiring a ribbon.',
      },
    ],
  },
];

export const GuidesPage: React.FC<GuidesPageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGuideId, setActiveGuideId] = useState<string>(GUIDES[0].id);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory =
      selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.directAnswer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeGuide =
    GUIDES.find((g) => g.id === activeGuideId) || filteredGuides[0] || GUIDES[0];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Guides Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Seller Knowledge Base</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ecommerce Shipping Label Guides
        </h1>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed">
          Practical guides for preparing, cropping, printing, and working with ecommerce shipping-label
          PDFs. Designed to help online sellers master thermal label workflows and avoid fulfillment errors.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
          {[
            { id: 'all', label: 'All Guides' },
            { id: 'meesho', label: 'Meesho' },
            { id: 'flipkart', label: 'Flipkart' },
            { id: 'amazon', label: 'Amazon' },
            { id: 'printing', label: 'Printing' },
            { id: 'troubleshooting', label: 'Troubleshooting' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[#c9a57b] text-black font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#c9a57b]"
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Guides Navigation List */}
        <div className="lg:col-span-4 space-y-2.5">
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider block px-1 mb-2">
            Available Guides ({filteredGuides.length})
          </span>
          {filteredGuides.map((guide) => {
            const isSelected = guide.id === activeGuide.id;
            return (
              <button
                key={guide.id}
                onClick={() => {
                  setActiveGuideId(guide.id);
                  setExpandedFaqIndex(null);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#151515] border-[#c9a57b] shadow-lg shadow-[#c9a57b]/5 text-white'
                    : 'bg-[#0f0f0f] border-white/5 hover:border-white/15 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                  <span className="uppercase tracking-wider font-semibold text-[#c9a57b]">
                    {guide.category}
                  </span>
                  <span>{guide.readTime}</span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {guide.title}
                </h3>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">
                  {guide.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Full Selected Guide Article */}
        <article className="lg:col-span-8 bg-[#111111] border border-white/10 rounded-3xl p-6 sm:p-8 lg:p-10 space-y-8">
          {/* Article Header */}
          <div className="space-y-3 border-b border-white/5 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c9a57b]/15 text-[#c9a57b] border border-[#c9a57b]/25 uppercase tracking-wide">
                {activeGuide.category} Guide
              </span>
              <span className="text-xs text-white/40">{activeGuide.readTime}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeGuide.title}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {activeGuide.summary}
            </p>
          </div>

          {/* Direct Answer Callout */}
          <div className="bg-[#181818] border-l-4 border-[#c9a57b] rounded-r-2xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c9a57b] flex items-center space-x-1.5">
              <Info className="w-4 h-4" />
              <span>Key Information & Direct Answer</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              {activeGuide.directAnswer}
            </p>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Step-by-Step Instructions</span>
            </h3>
            <div className="space-y-3">
              {activeGuide.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <span className="w-6 h-6 rounded-lg bg-[#c9a57b]/20 text-[#c9a57b] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist: Things to Check & Mistakes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Things to Check */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Important Things to Check</span>
              </h4>
              <ul className="space-y-2 text-xs text-white/60 leading-relaxed">
                {activeGuide.checks.map((check, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Mistakes */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Common Mistakes to Avoid</span>
              </h4>
              <ul className="space-y-2 text-xs text-white/60 leading-relaxed">
                {activeGuide.mistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Practical Tips */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              💡 Practical Seller Tip
            </h4>
            <div className="space-y-1 text-xs text-white/70">
              {activeGuide.tips.map((tip, idx) => (
                <p key={idx}>{tip}</p>
              ))}
            </div>
          </div>

          {/* Related Tool Banner */}
          <div className="bg-gradient-to-r from-[#171717] to-[#121212] border border-[#c9a57b]/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#c9a57b] tracking-wider">
                Related Tool
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                Apply this guide with {activeGuide.relatedTool.name}
              </p>
            </div>
            <button
              onClick={() => onNavigate(activeGuide.relatedTool.route)}
              className="px-4 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 whitespace-nowrap shadow-md shadow-[#c9a57b]/10"
            >
              <span>Launch Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Frequently Asked Questions Accordion */}
          {activeGuide.faqs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[#c9a57b]" />
                <span>Guide Questions & Answers</span>
              </h3>
              <div className="space-y-2.5">
                {activeGuide.faqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaqIndex(isExpanded ? null : idx)
                        }
                        className="w-full text-left p-4 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-[#c9a57b] transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-white/40 transition-transform ${
                            isExpanded ? 'rotate-180 text-[#c9a57b]' : ''
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs text-white/60 leading-relaxed border-t border-white/5">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
