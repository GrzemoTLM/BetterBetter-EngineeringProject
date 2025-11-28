import { Upload, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import api from '../services/api';
import type { OcrExtractResponse } from '../types/coupons';

interface UploadCouponProps {
  onOcrParsed?: (coupon: OcrExtractResponse) => void;
}

const UploadCoupon = ({ onOcrParsed }: UploadCouponProps) => {
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successProgress, setSuccessProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startSuccessProgress = () => {
    setSuccessVisible(true);
    setFinished(false);
    setSuccessProgress(0);

    const totalDuration = 3500;
    const stepMs = 100;
    const steps = totalDuration / stepMs;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep += 1;
      const pct = Math.min(100, (currentStep / steps) * 100);
      setSuccessProgress(pct);

      if (pct >= 100) {
        window.clearInterval(interval);
        setTimeout(() => {
          setSuccessVisible(false);
          setFinished(false);
        }, 500);
      }
    }, stepMs);
  };

  const handleFile = async (file: File) => {
    if (!file) {
      console.error('[UI] OCR Dropzone - No file provided');
      return;
    }

    const mime = file.type;
    if (!(mime.startsWith('image/') || mime === 'application/pdf')) {
      console.error('[UI] OCR Dropzone - Unsupported file type:', mime, 'name:', file.name);
      return;
    }

    console.log('[UI] OCR Dropzone - Selected file:', file.name, mime, file.size);

    // Pasek startuje od razu przy wysyłaniu
    startSuccessProgress();

    try {
      const result = await api.extractCouponViaOCR(file);
      console.log('[UI] OCR Dropzone - Server response:', result);

      if (onOcrParsed) {
        onOcrParsed(result);
      }

      // Dopiero przy sukcesie pokazujemy tekst "Kupon został dodany"
      setFinished(true);
    } catch (err) {
      console.error('[UI] OCR Dropzone - Error calling OCR API:', err);
      // Przy błędzie chowamy pasek
      setSuccessVisible(false);
      setFinished(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) {
      console.error('[UI] OCR Dropzone - No file dropped');
      return;
    }

    const file = files[0];
    void handleFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    void handleFile(file);

    // allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-6 space-y-4">
      {successVisible && (
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex flex-col gap-2 text-sm text-emerald-900">
          {finished && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Kupon został dodany</span>
            </div>
          )}
          <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-100 ease-linear"
              style={{ width: `${successProgress}%` }}
            />
          </div>
        </div>
      )}

      {!showDropzone ? (
        <button
          onClick={() => setShowDropzone(true)}
          className="w-full bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Camera size={20} />
          Import via OCR
        </button>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Upload Coupon (OCR)
          </h3>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors ${
              isDragging
                ? 'border-primary-main bg-blue-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-primary-main/10 rounded-full flex items-center justify-center">
                <Camera size={32} className="text-primary-main" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-text-primary mb-1">
                  Upload coupon (OCR) or Drag & Drop
                </p>
                <p className="text-sm text-text-secondary">
                  Supported formats: JPG, PNG, PDF
                </p>
              </div>
              <button
                type="button"
                onClick={handleChooseFileClick}
                className="mt-4 bg-primary-main text-primary-contrast rounded-lg px-6 py-2 hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <Upload size={18} />
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadCoupon;
