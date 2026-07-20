import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Image as ImageIcon } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-bold text-[#696969] mb-1.5 uppercase tracking-wider font-heading">
        קבלה / אסמכתא (אופציונלי)
      </label>

      {selectedFile ? (
        <div className="flex items-center justify-between p-3.5 bg-white rounded-full border border-[ink-black]/15 text-[ink-black] shadow-xs">
          <div className="flex items-center space-x-3 space-x-reverse truncate">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-5 h-5 text-[#CF4500] shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-[ink-black] shrink-0" />
            )}
            <div className="truncate">
              <p className="text-xs font-semibold truncate text-[ink-black]">{selectedFile.name}</p>
              <p className="text-[10px] text-[#696969]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1.5 rounded-full text-[#696969] hover:text-[#CF4500] hover:bg-canvas-cream transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#CF4500] bg-[#CF4500]/5'
              : 'border-[ink-black]/20 hover:border-[ink-black]/40 bg-canvas-cream/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-[#CF4500] mx-auto mb-2" />
          <p className="text-xs font-semibold text-[ink-black]">
            גרור והפלת קבלה לכאן, או <span className="text-[#CF4500] underline font-bold">לחץ לעיון בקבצים</span>
          </p>
          <p className="text-[10px] text-[#696969] mt-1">תומך בקבצי JPG, PNG, WEBP, PDF עד 5MB</p>
        </div>
      )}
    </div>
  );
};

