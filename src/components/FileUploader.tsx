import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFileStore } from '../hooks/useFileStore';
import LoadingSpinner from './LoadingSpinner';

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface FileUploaderProps {
  onUploaded: (fileId: string, file: File) => void;
  label?: string;
}

export default function FileUploader({ onUploaded, label = 'Tap to upload a file' }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { saveFile } = useFileStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    if (!ACCEPTED.includes(file.type)) {
      setError('Only PDF, JPG, PNG, WEBP files are accepted.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File size must be under 10MB.');
      return;
    }
    setUploading(true);
    try {
      const fileId = await saveFile(file);
      onUploaded(fileId, file);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div>
      <div
        className="upload-zone"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-[var(--color-text-muted)]" />
            <span className="text-sm">{label}</span>
            <span className="text-xs text-[var(--color-text-muted)]">PDF, JPG, PNG, WEBP · Max 10MB</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
