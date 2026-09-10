import React, { useState, useRef, useEffect } from 'react';
import { useAccounts } from '../context/AccountContext';
import { isDebugMode } from '../utils/debugMode';
import { AppRoute } from '../utils/router';
import {
  Store,
  ChevronDown,
  Plus,
  Edit2,
  Check,
  Settings,
  FileText,
  ShieldCheck,
  HelpCircle,
  Crop,
  Layers,
  ArrowRight,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';

interface HeaderProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenAccountModal: (editMode?: boolean) => void;
  onOpenTemplateModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAcceptanceTestsModal: () => void;
  onOpenHelpModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  onOpenAccountModal,
  onOpenTemplateModal,
  onOpenSettingsModal,
  onOpenAcceptanceTestsModal,
  onOpenHelpModal,
}) => {
  const { accounts, activeAccount, selectAccount } = useAccounts();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolsDropdownRef.current &&
        !toolsDropdownRef.current.contains(e.target as Node)
      ) {
        setToolsDropdownOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMeesho = currentRoute === 'meesho-promotional-label';

  return (
    <header className="bg-[#0d0d0d] border-b border-white/5 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 sm:space-x-6 min-w-0">
            <button
              id="brand-logo-btn"
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2.5 sm:space-x-3 text-left group focus:outline-none min-w-0"
            >
              <img
                src="/png_to_svg_converter_by_poper.svg"
                alt="LabelFix Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-lg shadow-[#c9a57b]/10 ring-1 ring-white/10 group-hover:scale-[1.02] transition-transform flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-wider text-white group-hover:text-[#c9a57b] transition-colors truncate">
                    LabelFix
                  </span>
                  {currentRoute === 'home' && (
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#c9a57b]/10 text-[#c9a57b] border border-[#c9a57b]/20 rounded-full">
                      4×6 Thermal Tools
                    </span>
                  )}
                  {currentRoute === 'meesho-promotional-label' && (
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-[#c9a57b]/15 text-[#c9a57b] border border-[#c9a57b]/30 rounded-full">
                      Meesho Promotional Label
                    </span>
                  )}
                  {currentRoute === 'flipkart-label-crop' && (
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-full">
                      Flipkart Label Crop
                    </span>
                  )}
                  {currentRoute === 'amazon-label-crop' && (
                    <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full">
                      Amazon Label Processor
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-white/40 font-medium tracking-tight truncate hidden xs:block sm:block">
                  {currentRoute === 'meesho-promotional-label'
                    ? 'Upload → Customize → Preview → Print'
                    : 'Simple Tools for E-commerce Shipping Labels'}
                </p>
              </div>
            </button>

            {/* Main Navigation Links (Home, All Tools, Guides, FAQ, About, Contact) */}
            <nav className="hidden lg:flex items-center space-x-1 pl-2">
              <button
                id="nav-home-btn"
                onClick={() => onNavigate('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentRoute === 'home'
                    ? 'text-[#c9a57b] bg-white/5 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Home
              </button>

              {/* Tools Dropdown & All Tools Link */}
              <div className="relative" ref={toolsDropdownRef}>
                <div className="flex items-center">
                  <button
                    id="nav-all-tools-btn"
                    onClick={() => onNavigate('tools')}
                    className={`px-2.5 py-1.5 rounded-l-lg text-xs font-medium transition-colors ${
                      currentRoute === 'tools' ||
                      currentRoute === 'meesho-promotional-label' ||
                      currentRoute === 'flipkart-label-crop' ||
                      currentRoute === 'amazon-label-crop'
                        ? 'text-[#c9a57b] bg-[#c9a57b]/10 font-semibold'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All Tools
                  </button>
                  <button
                    id="nav-tools-dropdown-btn"
                    onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                    aria-label="Open tools menu"
                    className={`px-1.5 py-1.5 rounded-r-lg text-xs font-medium transition-colors border-l border-white/5 ${
                      currentRoute === 'tools' ||
                      currentRoute === 'meesho-promotional-label' ||
                      currentRoute === 'flipkart-label-crop' ||
                      currentRoute === 'amazon-label-crop'
                        ? 'text-[#c9a57b] bg-[#c9a57b]/10'
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {toolsDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-[#141414] rounded-2xl shadow-2xl border border-white/10 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/5 mb-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Available Tools
                      </span>
                      <button
                        onClick={() => {
                          onNavigate('tools');
                          setToolsDropdownOpen(false);
                        }}
                        className="text-[10px] text-[#c9a57b] hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {/* Meesho */}
                    <button
                      onClick={() => {
                        onNavigate('meesho-promotional-label');
                        setToolsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-2.5 transition-colors ${
                        currentRoute === 'meesho-promotional-label'
                          ? 'bg-[#c9a57b]/15 text-white'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#c9a57b]/20 text-[#c9a57b] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">Meesho Promotional Label</p>
                        <p className="text-[10px] text-white/40 leading-snug">Add store promo & QR code</p>
                      </div>
                    </button>

                    {/* Flipkart */}
                    <button
                      onClick={() => {
                        onNavigate('flipkart-label-crop');
                        setToolsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-2.5 transition-colors ${
                        currentRoute === 'flipkart-label-crop'
                          ? 'bg-blue-500/15 text-white'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Crop className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">Flipkart Label Crop</p>
                        <p className="text-[10px] text-white/40 leading-snug">Crop shipping labels for 4×6</p>
                      </div>
                    </button>

                    {/* Amazon */}
                    <button
                      onClick={() => {
                        onNavigate('amazon-label-crop');
                        setToolsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-2.5 transition-colors ${
                        currentRoute === 'amazon-label-crop'
                          ? 'bg-amber-500/15 text-white'
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white">Amazon Label Tool</p>
                        <p className="text-[10px] text-white/40 leading-snug">Pair with invoices & add (SKU) | Qty</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Guides Link */}
              <button
                id="nav-guides-btn"
                onClick={() => onNavigate('guides')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentRoute === 'guides'
                    ? 'text-[#c9a57b] bg-white/5 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Guides
              </button>

              {/* FAQ Link */}
              <button
                id="nav-faq-btn"
                onClick={() => onNavigate('faq')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentRoute === 'faq'
                    ? 'text-[#c9a57b] bg-white/5 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                FAQ
              </button>

              {/* About Link */}
              <button
                id="nav-about-btn"
                onClick={() => onNavigate('about')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentRoute === 'about'
                    ? 'text-[#c9a57b] bg-white/5 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                About
              </button>

              {/* Contact Link */}
              <button
                id="nav-contact-btn"
                onClick={() => onNavigate('contact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentRoute === 'contact'
                    ? 'text-[#c9a57b] bg-white/5 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Contact
              </button>
            </nav>
          </div>

          {/* Right Area: Account Selector (for Meesho) OR Quick Tools CTA */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {isMeesho ? (
              <>
                {/* Active Account Switcher for Meesho Tool */}
                <div className="relative" ref={accountDropdownRef}>
                  <button
                    id="account-dropdown-btn"
                    type="button"
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    className="flex items-center space-x-1.5 sm:space-x-2.5 bg-[#141414] hover:bg-[#1c1c1c] text-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/10 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#c9a57b]/40"
                  >
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c9a57b] flex-shrink-0" />
                    <div className="text-left max-w-[90px] xs:max-w-[130px] sm:max-w-[170px]">
                      <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.12em] sm:tracking-[0.15em] text-white/40 leading-none">
                        Active Account
                      </div>
                      <div className="text-xs font-semibold truncate text-white mt-0.5">
                        {activeAccount ? activeAccount.accountName : 'No Store Selected'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40 ml-0.5" />
                  </button>

                  {/* Dropdown Menu */}
                  {accountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#141414] rounded-2xl shadow-2xl border border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                      <div className="px-3.5 py-1.5 border-b border-white/5 mb-1">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                          Switch Meesho Account
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto py-1">
                        {accounts.length === 0 ? (
                          <div className="px-3.5 py-3 text-center text-xs text-white/40">
                            No accounts saved. Click below to add one.
                          </div>
                        ) : (
                          accounts.map((acc) => (
                            <button
                              key={acc.id}
                              onClick={() => {
                                selectAccount(acc.id);
                                setAccountDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                                activeAccount && acc.id === activeAccount.id
                                  ? 'bg-[#c9a57b]/15 text-[#c9a57b] font-medium'
                                  : 'text-[#d1d1d1] hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 truncate">
                                <Store
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    activeAccount && acc.id === activeAccount.id
                                      ? 'text-[#c9a57b]'
                                      : 'text-white/40'
                                  }`}
                                />
                                <div className="truncate">
                                  <p className="text-xs font-medium text-white truncate">
                                    {acc.accountName}
                                  </p>
                                  <p className="text-[10px] text-white/40 truncate">
                                    {acc.storeLink}
                                  </p>
                                </div>
                              </div>
                              {activeAccount && acc.id === activeAccount.id && (
                                <Check className="w-4 h-4 text-[#c9a57b] flex-shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      <div className="border-t border-white/5 mt-1 pt-1 px-2 space-y-1">
                        {activeAccount && (
                          <button
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              onOpenAccountModal(true);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-2 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-white/40" />
                            <span>Edit Current Account & Store Link</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            onOpenAccountModal(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-[#c9a57b] hover:text-[#d9b58b] hover:bg-[#c9a57b]/10 rounded-lg flex items-center space-x-2 font-medium transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#c9a57b]" />
                          <span>Add New Meesho Account</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Action Navigation for Meesho */}
                <div className="hidden lg:flex items-center space-x-1.5">
                  <button
                    id="templates-btn"
                    onClick={onOpenTemplateModal}
                    disabled={!activeAccount}
                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Message Templates"
                  >
                    <FileText className="w-3.5 h-3.5 text-white/40" />
                    <span>Message</span>
                  </button>

                  <button
                    id="settings-btn"
                    onClick={onOpenSettingsModal}
                    disabled={!activeAccount}
                    className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl border border-white/5 hover:border-white/10 flex items-center space-x-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Print & Thermal Settings"
                  >
                    <Settings className="w-3.5 h-3.5 text-white/40" />
                    <span>Settings</span>
                  </button>

                  {isDebugMode() && (
                    <button
                      id="tests-btn"
                      onClick={onOpenAcceptanceTestsModal}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center space-x-1.5 transition-all"
                      title="Run Master Rule & Account Deletion Checks"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rules & Tests</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Non-Meesho header view (Home, Flipkart, Amazon): Tools Switcher CTA */
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('meesho-promotional-label')}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#c9a57b] hover:bg-[#d9b58b] text-black font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-xs whitespace-nowrap"
                >
                  <Store className="w-3.5 h-3.5 text-black flex-shrink-0" />
                  <span className="hidden sm:inline">Meesho Tool</span>
                  <span className="sm:hidden">Meesho</span>
                  <ArrowRight className="w-3 h-3 text-black flex-shrink-0" />
                </button>
              </div>
            )}

            {/* Help Button */}
            <button
              id="help-btn"
              onClick={onOpenHelpModal}
              className="p-1.5 sm:p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex-shrink-0"
              title="Help & Info"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Mobile Navigation Hamburger Toggle */}
            <div className="lg:hidden" ref={mobileMenuRef}>
              <button
                id="mobile-nav-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
                className="p-1.5 sm:p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors flex-shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Mobile Drawer Dropdown */}
              {mobileMenuOpen && (
                <div className="absolute left-0 right-0 top-full bg-[#0d0d0d] border-b border-white/10 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
                  <div className="space-y-1 pb-3 border-b border-white/5">
                    <button
                      onClick={() => {
                        onNavigate('home');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                        currentRoute === 'home'
                          ? 'bg-[#c9a57b]/15 text-[#c9a57b] font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>Home</span>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('tools');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                        currentRoute === 'tools'
                          ? 'bg-[#c9a57b]/15 text-[#c9a57b] font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>All Tools</span>
                    </button>
                  </div>

                  {/* Marketplace Tools List */}
                  <div className="py-3 border-b border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3.5 block mb-1">
                      Shipping Tools
                    </span>
                    <button
                      onClick={() => {
                        onNavigate('meesho-promotional-label');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2.5 ${
                        currentRoute === 'meesho-promotional-label'
                          ? 'bg-[#c9a57b]/15 text-[#c9a57b]'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Store className="w-4 h-4 text-[#c9a57b]" />
                      <div>
                        <p className="font-semibold text-white">Meesho Promotional Label</p>
                        <p className="text-[10px] text-white/40">Add promo QR & message</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('flipkart-label-crop');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2.5 ${
                        currentRoute === 'flipkart-label-crop'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Crop className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-semibold text-white">Flipkart Label Crop</p>
                        <p className="text-[10px] text-white/40">Clean crop for 4×6 thermal</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('amazon-label-crop');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2.5 ${
                        currentRoute === 'amazon-label-crop'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">Amazon Label Tool</p>
                        <p className="text-[10px] text-white/40">Add SKU & Qty</p>
                      </div>
                    </button>
                  </div>

                  {/* Secondary Pages */}
                  <div className="pt-3 space-y-1">
                    <button
                      onClick={() => {
                        onNavigate('guides');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium ${
                        currentRoute === 'guides'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Guides
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('faq');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium ${
                        currentRoute === 'faq'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      FAQ
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('about');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium ${
                        currentRoute === 'about'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      About
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('contact');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium ${
                        currentRoute === 'contact'
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      Contact
                    </button>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between px-3.5 text-[11px] text-white/40">
                      <button
                        onClick={() => {
                          onNavigate('privacy-policy');
                          setMobileMenuOpen(false);
                        }}
                        className="hover:text-white"
                      >
                        Privacy Policy
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => {
                          onNavigate('terms');
                          setMobileMenuOpen(false);
                        }}
                        className="hover:text-white"
                      >
                        Terms
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
