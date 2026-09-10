import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Search, ShieldCheck, Printer, Store, Crop, Layers, FileText } from 'lucide-react';
import { AppRoute } from '../utils/router';

interface FAQPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface FAQItem {
  category: 'general' | 'pdf' | 'meesho' | 'flipkart' | 'amazon' | 'printing' | 'privacy';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  // GENERAL
  {
    category: 'general',
    question: 'What is LabelFix?',
    answer:
      'LabelFix is a collection of practical web tools designed to help ecommerce sellers prepare shipping-label PDFs for printing and packaging. It provides specialized utilities for Meesho promotional labels, Flipkart label cropping, and Amazon label & invoice pairing.',
  },
  {
    category: 'general',
    question: 'Do I need to install any software or desktop drivers to use LabelFix?',
    answer:
      'No. LabelFix runs entirely in your web browser. You only need standard drivers for your physical thermal printer (such as TVS, TSC, Zebra, or Rollo) installed on your operating system.',
  },
  {
    category: 'general',
    question: 'Is LabelFix affiliated with or endorsed by Meesho, Flipkart, or Amazon?',
    answer:
      'No. LabelFix is an independent third-party utility built for online sellers. All marketplace trademarks and platform names belong to their respective corporate owners.',
  },

  // PDF
  {
    category: 'pdf',
    question: 'What PDF formats does LabelFix support?',
    answer:
      'LabelFix supports standard digital PDF files downloaded directly from official marketplace seller portals. Files must have selectable vector text and intact vector barcode paths. Encrypted PDFs or photo scans are not supported.',
  },
  {
    category: 'pdf',
    question: 'Why does my PDF fail to process or display an error?',
    answer:
      'Common causes include password protection, corrupt downloads, or non-standard third-party PDF generators that flattened text into low-resolution images. Re-download the official label batch from your seller portal and upload again.',
  },
  {
    category: 'pdf',
    question: 'Can I process multi-page PDF batches at once?',
    answer:
      'Yes. All three LabelFix tools support multi-page batches. The Flipkart tool is tested for 90+ label batches, and the Amazon tool automatically pairs multi-page invoices with shipping labels.',
  },

  // MEESHO
  {
    category: 'meesho',
    question: 'How does the Meesho Promotional Label tool avoid blocking shipping barcodes?',
    answer:
      'The tool uses an automated multi-stage document analyzer that identifies invoice table endpoints and legal line boundaries. It calculates the remaining dead whitespace at the bottom of the page and places your store QR code and promotional message strictly below all courier details.',
  },
  {
    category: 'meesho',
    question: 'Where do I get my Meesho store link for the QR code?',
    answer:
      'Open your public Meesho storefront in the Meesho consumer app or web browser (e.g. meesho.com/yourstore), copy the URL, and paste it into LabelFix Store Settings. The tool converts this link into a high-contrast QR code automatically.',
  },
  {
    category: 'meesho',
    question: 'Will courier partners like Delhivery or Shadowfax reject parcels with promotional QR codes?',
    answer:
      'No. Logistics partners only require clear, unobstructed carrier barcodes, AWB tracking numbers, and delivery address blocks. Because promotional notes sit exclusively in unreserved whitespace below the official label, standard package handling is not affected.',
  },

  // FLIPKART
  {
    category: 'flipkart',
    question: 'Why do Flipkart labels need to be cropped?',
    answer:
      'Flipkart frequently generates shipping labels on standard A4 pages alongside tax invoices and customer packing slips. To print on standard 4×6 inch (100×150 mm) thermal paper rolls, the shipping label must be cleanly isolated to prevent wasted paper and unreadable, shrunken text.',
  },
  {
    category: 'flipkart',
    question: 'Does cropping reduce barcode resolution or cause scan failures?',
    answer:
      'No. The Flipkart engine performs vector cropping using native PDF path math. Barcode lines, QR matrices, and text retain their original 1:1 vector resolution for sharp thermal printing.',
  },
  {
    category: 'flipkart',
    question: 'Can I manually adjust the crop boundaries if my Flipkart label layout shifts?',
    answer:
      'Yes. The Flipkart tool features interactive crop handles and manual coordinate inputs (X, Y, Width, Height) so you can fine-tune the exact crop rectangle if needed.',
  },

  // AMAZON
  {
    category: 'amazon',
    question: 'How does the Amazon Label Tool pair labels with invoices?',
    answer:
      'The tool dynamically scans the uploaded PDF sequence, identifies shipping label sheets and subsequent multi-page invoices, and pairs them using order identifiers. It then extracts the SKU and quantity details from the invoice table and stamps them cleanly onto the corresponding label.',
  },
  {
    category: 'amazon',
    question: 'Where is the SKU and quantity information placed on the Amazon label?',
    answer:
      'It is positioned inside the horizontal blank whitespace band on the label layout. The Amazon tool leaves original Amazon page dimensions completely intact and automatically excludes invoice sheets from the final print stream so only labels are sent to the printer.',
  },
  {
    category: 'amazon',
    question: 'What format does the extracted product information use?',
    answer:
      'Extracted items are formatted as readable (SKU) | Qty text (for example: (SUMMER-TSHIRT-BLUE-L) | Qty: 2), making warehouse picking and verification instant without checking separate invoice papers.',
  },

  // PRINTING
  {
    category: 'printing',
    question: 'What thermal printer settings should I use for 4×6 labels?',
    answer:
      'In your browser or PDF viewer print dialog: select your thermal printer (TVS, TSC, Zebra, Rollo, Xprinter), set Paper Size to 4×6 inches (100×150 mm), set Margins to None, and set Scale to 100% (Actual Size). Never use "Fit to Printable Area".',
  },
  {
    category: 'printing',
    question: 'Why are my printed barcodes blurry or failing scanner checks?',
    answer:
      'Blurry barcodes are usually caused by incorrect print scaling (shrinking the PDF), dirty thermal printheads, or print density set too low. Ensure Scale is 100%, clean the printhead with alcohol wipes, and increase density in your operating system printer settings.',
  },

  // PRIVACY
  {
    category: 'privacy',
    question: 'Are my customer shipping labels uploaded to an external server?',
    answer:
      'No. LabelFix executes 100% in-browser client-side processing using Web APIs, PDF.js, and pdf-lib. Your shipping labels, customer names, addresses, phone numbers, and invoice prices are never transmitted to any external server or saved in any remote database.',
  },
  {
    category: 'privacy',
    question: 'Where are my store name and custom message templates stored?',
    answer:
      'Store settings and template preferences are saved solely in your local web browser using browser localStorage. You can view, export, import, or wipe this data at any time from the Settings menu.',
  },
];

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleAccordion = (index: number) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const expandAll = () => {
    setExpandedIndices(filteredItems.map((_, i) => i));
  };

  const collapseAll = () => {
    setExpandedIndices([]);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#c9a57b]/10 border border-[#c9a57b]/20 text-[#c9a57b] text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          LabelFix FAQ
        </h1>
        <p className="text-sm sm:text-base text-white/60 leading-relaxed">
          Find answers to common questions about using LabelFix, preparing shipping labels,
          processing PDF batches, thermal printer setup, and data privacy.
        </p>
      </div>

      {/* Controls: Category Filter & Search */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs scrollbar-none">
            {[
              { id: 'all', label: 'All Questions' },
              { id: 'general', label: 'General' },
              { id: 'pdf', label: 'PDF' },
              { id: 'meesho', label: 'Meesho' },
              { id: 'flipkart', label: 'Flipkart' },
              { id: 'amazon', label: 'Amazon' },
              { id: 'printing', label: 'Printing' },
              { id: 'privacy', label: 'Privacy' },
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

          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-9 pr-3.5 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#c9a57b]"
            />
          </div>
        </div>

        {/* Expand / Collapse helpers */}
        <div className="flex items-center justify-between text-xs text-white/40 pt-1">
          <span>Showing {filteredItems.length} questions</span>
          <div className="space-x-3">
            <button onClick={expandAll} className="hover:text-white transition-colors">
              Expand All
            </button>
            <span>•</span>
            <button onClick={collapseAll} className="hover:text-white transition-colors">
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedIndices.includes(index);
          return (
            <div
              key={index}
              className="bg-[#111111] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 focus:outline-none"
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#c9a57b]">
                    {item.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {item.question}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-white/40 flex-shrink-0 mt-1 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180 text-[#c9a57b]' : ''
                  }`}
                />
              </button>
              {isExpanded && (
                <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 bg-[#111111] border border-white/5 rounded-2xl space-y-2">
            <p className="text-sm font-semibold text-white">No questions found</p>
            <p className="text-xs text-white/50">
              Try searching with different keywords or switch categories.
            </p>
          </div>
        )}
      </div>

      {/* Need More Help Box */}
      <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white">Still have a question?</h3>
          <p className="text-xs text-white/50 mt-1">
            Check our step-by-step Guides or reach out to our team via the Contact page.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('guides')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            Browse Guides
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className="px-4 py-2 bg-[#c9a57b] hover:bg-[#d9b58b] text-black text-xs font-bold rounded-xl transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};
