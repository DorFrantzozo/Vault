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
      <label className="block text-xs font-medium text-slate-300 mb-2">
        קבלה / אסמכתא (אופציונלי)
      </label>

      {selectedFile ? (
        <div className="flex items-center justify-between p-3.5 bg-slate-800 rounded-xl border border-sky-500/40 text-slate-200">
          <div className="flex items-center space-x-3 space-x-reverse truncate">
            {selectedFile.type.startsWith('image/') ? (
              <ImageIcon className="w-5 h-5 text-sky-400 shrink-0" />
            ) : (
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <div className="truncate">
              <p className="text-xs font-medium truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFileSelect(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50"
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
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-200">
            גרור והפלת קבלה לכאן, או <span className="text-sky-400 underline">לחץ לעיון בקבצים</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">תומך בקבצי JPG, PNG, WEBP, PDF עד 5MB</p>
        </div>
      )}
    </div>
  );
};
