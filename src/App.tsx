import React, { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AccountProvider, useAccounts } from './context/AccountContext';
import { LabelDetectionResult, ProcessedBatchResult } from './types';
import { analyzePDFPage, build4x6PrintReadyPDF } from './utils/pdfEngine';
import { generateSampleMeeshoPDF } from './utils/sampleMeeshoGenerator';
import { isDebugMode } from './utils/debugMode';
import { useAppRoute, AppRoute, scrollToTop } from './utils/router';

import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { FlipkartToolView } from './components/FlipkartToolView';
import { AmazonToolView } from './components/AmazonToolView';
import { AllToolsPage } from './components/AllToolsPage';
import { GuidesPage } from './components/GuidesPage';
import { FAQPage } from './components/FAQPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsPage } from './components/TermsPage';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { UploadArea } from './components/UploadArea';
import { SafetyChecklist } from './components/SafetyChecklist';
import { LabelPreview } from './components/LabelPreview';
import { BatchProcessor } from './components/BatchProcessor';
import { AccountManagerModal } from './components/AccountManagerModal';
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { AcceptanceTestsModal } from './components/AcceptanceTestsModal';
import { HelpModal } from './components/HelpModal';
import { ArrowLeft, Store } from 'lucide-react';

function MainApp() {
  const { accounts, activeAccount } = useAccounts();
  const [currentRoute, navigateTo] = useAppRoute();

  // PDF Data & Analysis state (for Meesho Promotional Label processor)
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [detectionResults, setDetectionResults] = useState<LabelDetectionResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Batch Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [processedResult, setProcessedResult] = useState<ProcessedBatchResult | null>(null);

  // Performance tracking: avoid duplicate PDF re-analysis when loading
  const lastAnalyzedBytesRef = React.useRef<Uint8Array | null>(null);
  const lastAnalyzedAccountRef = React.useRef(activeAccount);

  // Clean up blob URL when processedResult changes or unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (processedResult?.pdfUrl) {
        URL.revokeObjectURL(processedResult.pdfUrl);
      }
    };
  }, [processedResult?.pdfUrl]);

  // Modals state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountEditMode, setAccountEditMode] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [acceptanceTestsModalOpen, setAcceptanceTestsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Global scroll-to-top on route change so new page always starts at top
  useEffect(() => {
    scrollToTop();
  }, [currentRoute]);

  // Update browser document title and meta description based on active route
  useEffect(() => {
    let title = 'LabelFix — Simple Tools for E-commerce Shipping Labels';
    let description = 'Simple tools for e-commerce shipping labels: thermal-ready 4×6 label processing, promotional overlays, and marketplace cropping for Meesho, Flipkart, and Amazon sellers.';

    switch (currentRoute) {
      case 'tools':
        title = 'Ecommerce Shipping Label PDF Tools | LabelFix';
        description = "Use LabelFix's ecommerce shipping-label PDF tools for Meesho, Flipkart, and Amazon workflows. Prepare, crop, process, download, and print supported label PDFs.";
        break;
      case 'guides':
        title = 'Ecommerce Shipping Label Guides | LabelFix';
        description = 'Practical guides for preparing, cropping, printing, and working with ecommerce shipping-label PDFs.';
        break;
      case 'faq':
        title = 'LabelFix FAQ | Shipping Label PDF Questions';
        description = 'Find answers to common questions about LabelFix, PDF uploads, Meesho labels, Flipkart labels, Amazon labels, processing, downloads, and printing.';
        break;
      case 'about':
        title = 'About LabelFix | Ecommerce Shipping Label Tools';
        description = 'Learn about LabelFix, a simple collection of tools designed to help ecommerce sellers prepare shipping-label PDFs more efficiently.';
        break;
      case 'contact':
        title = 'Contact LabelFix | Support';
        description = 'Contact LabelFix for support, feedback, bug reports, and questions about ecommerce shipping-label PDF tools.';
        break;
      case 'privacy-policy':
        title = 'Privacy Policy | LabelFix';
        description = 'Learn how LabelFix handles uploaded PDF files, personal information, cookies, analytics, advertising, third-party services, security, and user privacy.';
        break;
      case 'terms':
        title = 'Terms of Service | LabelFix';
        description = 'Read the LabelFix Terms of Service covering tool usage, uploaded files, processing limitations, acceptable use, intellectual property, disclaimers, and service availability.';
        break;
      case 'meesho-promotional-label':
        title = 'Meesho Promotional Label — LabelFix';
        description = 'Prepare supported Meesho shipping labels and add your configured promotional QR content in the designated label whitespace.';
        break;
      case 'flipkart-label-crop':
        title = 'Flipkart Label Crop — LabelFix';
        description = 'Prepare supported Flipkart shipping-label PDFs using the dedicated crop workflow while preserving the label content.';
        break;
      case 'amazon-label-crop':
        title = 'Amazon Label Tool — LabelFix';
        description = 'Process supported Amazon shipping-label and invoice PDFs and place extracted SKU and quantity information in the designated label area.';
        break;
      case 'home':
      default:
        title = 'LabelFix — Simple Tools for E-commerce Shipping Labels';
        description = 'Prepare shipping-label PDFs more easily with practical tools for Meesho, Flipkart, and Amazon workflows.';
        break;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  }, [currentRoute]);

  // First Visit Experience for Meesho: If entering Meesho tool without saved accounts, prompt setup
  useEffect(() => {
    if (currentRoute === 'meesho-promotional-label' && accounts.length === 0) {
      setAccountEditMode(false);
      setAccountModalOpen(true);
    }
  }, [accounts.length, currentRoute]);

  // Re-run detection on active account changes so overlay reflects selected store QR & message
  useEffect(() => {
    if (!pdfBytes) return;

    // Skip if this exact PDF and account combination was already analyzed in handlePdfLoaded
    if (pdfBytes === lastAnalyzedBytesRef.current && activeAccount === lastAnalyzedAccountRef.current) {
      return;
    }
    lastAnalyzedBytesRef.current = pdfBytes;
    lastAnalyzedAccountRef.current = activeAccount;

    const reanalyze = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        const results: LabelDetectionResult[] = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const detection = await analyzePDFPage(page, i - 1, activeAccount);
          results.push(detection);
        }
        setDetectionResults(results);
      } catch (err) {
        console.error('Error reanalyzing PDF with new account:', err);
      }
    };

    reanalyze();
  }, [activeAccount, pdfBytes]);

  const handlePdfLoaded = async (bytes: Uint8Array, fileName: string) => {
    setIsLoading(true);
    setPdfBytes(bytes);
    setPdfFileName(fileName);
    setProcessedResult(null);
    setCurrentIndex(0);

    lastAnalyzedBytesRef.current = bytes;
    lastAnalyzedAccountRef.current = activeAccount;

    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const results: LabelDetectionResult[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const detection = await analyzePDFPage(page, i - 1, activeAccount);
        results.push(detection);
      }

      setDetectionResults(results);
    } catch (err) {
      console.error('Error parsing loaded PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async (count: number, type: 'single' | 'mixed' | 'tall' = 'single') => {
    setIsLoading(true);
    try {
      const sampleBytes = await generateSampleMeeshoPDF(count, type);
      const name =
        count === 1
          ? `Sample_Meesho_${type === 'tall' ? 'Tall' : 'Standard'}_Label.pdf`
          : `Sample_Meesho_Batch_${count}_Labels.pdf`;
      await handlePdfLoaded(sampleBytes, name);
    } catch (err) {
      console.error('Error generating sample:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessAll = async () => {
    if (!pdfBytes) return;
    if (!activeAccount) {
      alert('Please configure or select a Meesho store account first.');
      setAccountModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setProgressCurrent(0);

    try {
      const result = await build4x6PrintReadyPDF(
        pdfBytes,
        activeAccount,
        (current, _total) => {
          setProgressCurrent(current);
        }
      );

      setProcessedResult(result);
    } catch (err) {
      console.error('Error processing batch PDF:', err);
      alert('Failed to process label batch. Please check your PDF file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentDetection = detectionResults[currentIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans text-[#d1d1d1] antialiased selection:bg-[#c9a57b] selection:text-black">
      {/* Universal Header with LabelFix Brand & Multi-tool Navigation */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenAccountModal={(editMode = false) => {
          setAccountEditMode(editMode);
          setAccountModalOpen(true);
        }}
        onOpenTemplateModal={() => setTemplateModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onOpenAcceptanceTestsModal={() => setAcceptanceTestsModalOpen(true)}
        onOpenHelpModal={() => setHelpModalOpen(true)}
      />

      {/* Route Views */}
      {currentRoute === 'home' && (
        <HomePage
          onNavigate={navigateTo}
          onOpenHelpModal={() => setHelpModalOpen(true)}
        />
      )}

      {currentRoute === 'flipkart-label-crop' && (
        <FlipkartToolView
          onNavigate={navigateTo}
          onOpenHelpModal={() => setHelpModalOpen(true)}
        />
      )}

      {currentRoute === 'amazon-label-crop' && (
        <AmazonToolView
          onNavigate={navigateTo}
          onOpenHelpModal={() => setHelpModalOpen(true)}
        />
      )}

      {currentRoute === 'tools' && (
        <AllToolsPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'guides' && (
        <GuidesPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'faq' && (
        <FAQPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'about' && (
        <AboutPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'contact' && (
        <ContactPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'privacy-policy' && (
        <PrivacyPolicyPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'terms' && (
        <TermsPage onNavigate={navigateTo} />
      )}

      {currentRoute === 'meesho-promotional-label' && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Tool Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center space-x-3">
              <button
                id="back-to-tools-btn"
                onClick={() => navigateTo('home')}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                title="Back to All Tools"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Meesho Promotional Label
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#c9a57b]/15 text-[#c9a57b] border border-[#c9a57b]/25 rounded-full">
                    4×6 Thermal
                  </span>
                </div>
                <p className="text-xs text-white/40">
                  Add your store promotion and QR code to Meesho labels.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-white/40">
              <span className="hidden md:inline">Workflow:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#141414] border border-white/5 text-white/60 font-medium">
                Upload → Customize → Preview → Print
              </span>
            </div>
          </div>

          {/* Existing Meesho 3-Column Workspace */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sidebar: Account Details, Store Link, QR code */}
            <Sidebar
              onOpenAccountModal={(editMode = false) => {
                setAccountEditMode(editMode);
                setAccountModalOpen(true);
              }}
              onOpenTemplateModal={() => setTemplateModalOpen(true)}
              onOpenSettingsModal={() => setSettingsModalOpen(true)}
              onLoadSample={handleLoadSample}
              loadedCount={detectionResults.length}
            />

            {/* Center Column: Upload + Safety Checklist (debug only) + Batch Actions */}
            <div className="flex-1 w-full space-y-5 min-w-0">
              {/* Step 1: Upload PDF */}
              <UploadArea
                onFileLoaded={handlePdfLoaded}
                isLoading={isLoading}
                loadedFileName={pdfFileName}
                totalLabelsCount={detectionResults.length}
              />

              {/* Internal Developer / Debug Mode Only: Safety Verification & Audit */}
              {isDebugMode() && currentDetection && (
                <SafetyChecklist
                  detection={currentDetection}
                  totalCount={detectionResults.length}
                  currentIndex={currentIndex}
                />
              )}

              {/* Step 2: Process All & Output Actions */}
              <BatchProcessor
                totalLabels={detectionResults.length}
                isProcessing={isProcessing}
                progressCurrent={progressCurrent}
                processedResult={processedResult}
                onProcessAll={handleProcessAll}
                onPreviewFirst={() => setCurrentIndex(0)}
                detectionResults={detectionResults}
              />
            </div>

            {/* Right Column: Live 4×6 Canvas Label Preview */}
            <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0">
              <LabelPreview
                pdfBytes={pdfBytes}
                detectionResults={detectionResults}
                currentIndex={currentIndex}
                onPageChange={(idx) => setCurrentIndex(idx)}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      )}

      {/* Site-wide Universal Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Global Modals (for Meesho tool and platform configuration) */}
      <AccountManagerModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        editMode={accountEditMode}
      />

      <TemplateManagerModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <AcceptanceTestsModal
        isOpen={acceptanceTestsModalOpen}
        onClose={() => setAcceptanceTestsModalOpen(false)}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AccountProvider>
      <MainApp />
    </AccountProvider>
  );
}
