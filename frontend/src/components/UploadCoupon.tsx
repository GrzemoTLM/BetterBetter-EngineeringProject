import { Upload, Camera } from 'lucide-react';
import { useState } from 'react';

const UploadCoupon = () => {
  const [showDropzone, setShowDropzone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop logic here
  };

  if (!showDropzone) {
    return (
      <div className="bg-background-paper rounded-xl shadow-sm p-6">
        <button
          onClick={() => setShowDropzone(true)}
          className="w-full bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Camera size={20} />
          Import via OCR
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-6">
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
          <button className="mt-4 bg-primary-main text-primary-contrast rounded-lg px-6 py-2 hover:bg-primary-hover transition-colors flex items-center gap-2">
            <Upload size={18} />
            Choose File
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCoupon;

