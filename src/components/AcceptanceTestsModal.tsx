import React, { useState } from 'react';
import { useAccounts } from '../context/AccountContext';
import { AcceptanceTestItem } from '../types';
import {
  ACCEPTANCE_TESTS_LIST,
  runAcceptanceTest,
} from '../utils/acceptanceTests';
import {
  X,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Crop,
  Store,
  Layers,
} from 'lucide-react';

interface AcceptanceTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcceptanceTestsModal: React.FC<AcceptanceTestsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeAccount } = useAccounts();
  const [activeTab, setActiveTab] = useState<'all' | 'flipkart' | 'meesho' | 'amazon'>('all');
  const [tests, setTests] = useState<AcceptanceTestItem[]>(() =>
    ACCEPTANCE_TESTS_LIST.map((t) => ({
      ...t,
      status: 'idle',
    }))
  );
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const filteredTests = tests.filter((t) => {
    if (activeTab === 'amazon') return t.id >= 36 && t.id <= 39;
    if (activeTab === 'flipkart') return t.id >= 23 && t.id <= 34;
    if (activeTab === 'meesho') return t.id <= 22 || t.id === 35;
    return true;
  });

  const runSingleTest = async (testId: number) => {
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'running' } : t))
    );

    const res = await runAcceptanceTest(testId, activeAccount);

    setTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              status: res.passed ? 'passed' : 'failed',
              details: res.details,
              timeMs: res.timeMs,
            }
          : t
      )
    );
  };

  const handleRunBatch = async (itemsToRun: AcceptanceTestItem[]) => {
    setIsRunning(true);

    for (const test of itemsToRun) {
      setTests((prev) =>
        prev.map((t) => (t.id === test.id ? { ...t, status: 'running' } : t))
      );

      const res = await runAcceptanceTest(test.id, activeAccount);

      setTests((prev) =>
        prev.map((t) =>
          t.id === test.id
            ? {
                ...t,
                status: res.passed ? 'passed' : 'failed',
                details: res.details,
                timeMs: res.timeMs,
              }
            : t
        )
      );

      await new Promise((r) => setTimeout(r, 40));
    }

    setIsRunning(false);
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141414] rounded-2xl shadow-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#d1d1d1]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d0d0d] border-b border-white/5 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                LabelFix Master Acceptance Test Suite
              </h3>
              <p className="text-xs text-white/40">
                Automated compliance verification across Flipkart Label Crop & Meesho promotional engines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-2.5 bg-[#101010] border-b border-white/5 flex items-center justify-between gap-2 flex-shrink-0 text-xs">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab('flipkart')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'flipkart'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Crop className="w-3 h-3 text-blue-400" />
              <span>Flipkart Engine (10)</span>
            </button>
            <button
              onClick={() => setActiveTab('meesho')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'meesho'
                  ? 'bg-[#c9a57b]/20 text-[#c9a57b] border border-[#c9a57b]/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-3 h-3 text-[#c9a57b]" />
              <span>Meesho Engine (23)</span>
            </button>
            <button
              onClick={() => setActiveTab('amazon')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'amazon'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Amazon Engine (4)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold text-[11px]">
              {passedCount} Passed
            </span>
            {failedCount > 0 && (
              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold text-[11px]">
                {failedCount} Failed
              </span>
            )}
          </div>
        </div>

        {/* Toolbar & Run Actions */}
        <div className="px-6 py-3 bg-[#0d0d0d] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs text-white/60">
            Showing {filteredTests.length} tests in selected view
          </span>

          <div className="flex items-center space-x-2">
            {activeTab !== 'all' && (
              <button
                onClick={() => handleRunBatch(filteredTests)}
                disabled={isRunning}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                <span>Run {activeTab === 'flipkart' ? 'Flipkart' : 'Meesho'} Tests</span>
              </button>
            )}

            <button
              onClick={() => handleRunBatch(tests)}
              disabled={isRunning}
              className="px-4 py-1.5 bg-[#c9a57b] hover:bg-[#d9b58b] text-black rounded-xl text-xs font-bold shadow-md shadow-[#c9a57b]/10 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-black" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run All 32 Checks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test List Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2.5 divide-y divide-white/5">
          {filteredTests.map((t) => (
            <div
              key={t.id}
              className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-0.5">
                  {t.status === 'passed' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {t.status === 'failed' && (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  {t.status === 'running' && (
                    <RefreshCw className="w-4 h-4 text-[#c9a57b] animate-spin" />
                  )}
                  {t.status === 'idle' && (
                    <div className="w-4 h-4 rounded-full border-2 border-white/20"></div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium uppercase border ${
                        t.id >= 23
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : 'bg-white/5 text-white/50 border-white/5'
                      }`}
                    >
                      {t.category}
                    </span>
                  </div>
                  <p className="text-white/40 text-[11px] mt-0.5">{t.description}</p>
                  {t.details && (
                    <p
                      className={`text-[11px] mt-1 font-mono ${
                        t.status === 'passed' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      ↳ {t.details} {t.timeMs !== undefined && `(${t.timeMs}ms)`}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => runSingleTest(t.id)}
                disabled={t.status === 'running' || isRunning}
                className="flex-shrink-0 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors disabled:opacity-40"
              >
                Run
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d0d0d] border-t border-white/5 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#141414] hover:bg-[#1a1a1a] text-white/80 border border-white/10 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
