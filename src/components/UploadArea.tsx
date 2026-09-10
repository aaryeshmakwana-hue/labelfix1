import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  FileText,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface UploadAreaProps {
  onFileLoaded: (fileBytes: Uint8Array, fileName: string) => void;
  isLoading: boolean;
  loadedFileName?: string;
  totalLabelsCount?: number;
}

const formatFileNameDisplay = (name: string, maxLen = 32): string => {
  if (!name || name.length <= maxLen) return name;
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot !== -1 ? name.slice(lastDot) : '';
  const base = lastDot !== -1 ? name.slice(0, lastDot) : name;
  const avail = maxLen - ext.length - 3;
  if (avail <= 6) return name.slice(0, maxLen - 3) + '...' + ext;
  const front = Math.ceil(avail * 0.7);
  const back = Math.floor(avail * 0.3);
  return `${base.slice(0, front)}...${back > 0 ? base.slice(base.length - back) : ''}${ext}`;
};

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileLoaded,
  isLoading,
  loadedFileName,
  totalLabelsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF file (e.g. Meesho_Labels.pdf).');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      onFileLoaded(bytes, file.name);
    } catch (err: any) {
      console.error('Error reading PDF file:', err);
      setErrorMsg('Could not read the uploaded PDF. Please verify the file is not corrupted.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-[#141414] rounded-2xl border border-white/5 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2.5">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c9a57b]/15 text-[#c9a57b] text-xs font-bold">
            1
          </span>
          <h2 className="text-sm font-semibold text-white">
            Upload Original Meesho Label PDF
          </h2>
        </div>

        {loadedFileName && (
          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
            <FileCheck className="w-3.5 h-3.5" />
            <span>
              {totalLabelsCount || 1} {totalLabelsCount === 1 ? 'Label' : 'Labels'} Loaded
            </span>
          </span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        id="pdf-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer overflow-hidden transition-all duration-200 ${
          isDragging
            ? 'border-[#c9a57b] bg-[#c9a57b]/10 scale-[0.99]'
            : loadedFileName
            ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
            : 'border-white/10 hover:border-[#c9a57b]/50 bg-[#0d0d0d] hover:bg-[#121212]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onClick={(e) => {
            // Reset input value so selecting the same file triggers onChange reliably across browsers
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
          accept=".pdf,application/pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              loadedFileName
                ? 'bg-emerald-500/15 text-emerald-400'
                : isDragging
                ? 'bg-[#c9a57b]/20 text-[#c9a57b]'
                : 'bg-white/5 text-[#c9a57b]'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-[#c9a57b]" />
            ) : loadedFileName ? (
              <FileCheck className="w-7 h-7" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div className="w-full max-w-full min-w-0 px-2">
            {loadedFileName ? (
              <div className="w-full min-w-0">
                <p
                  className="text-sm font-semibold text-white truncate max-w-[240px] sm:max-w-xs md:max-w-sm mx-auto tracking-tight"
                  title={loadedFileName}
                >
                  {formatFileNameDisplay(loadedFileName, 36)}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  Click or drag another PDF here to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-white">
                  Drag & drop your Meesho label PDF here
                </p>
                <p className="text-xs text-white/50 mt-1">
                  or <span className="text-[#c9a57b] font-medium hover:underline">browse files</span> from your computer
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-white/30 tracking-tight">
            <span>Supports 1 to 100+ labels per PDF</span>
            <span>•</span>
            <span>Zero cloud upload</span>
            <span>•</span>
            <span>Exact 4×6 inch format</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-2.5 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
