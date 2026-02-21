import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useFileStore } from '../hooks/useFileStore';
import LoadingSpinner from './LoadingSpinner';

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

export default function FilePreview({ fileId, fileName, fileType, onClose }: FilePreviewProps) {
  const { getFile } = useFileStore();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    getFile(fileId).then(f => {
      if (f) {
        objectUrl = URL.createObjectURL(f.blob);
        setUrl(objectUrl);
        setBlob(f.blob);
      }
      setLoading(false);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, getFile]);

  const handleDownload = () => {
    if (blob) saveAs(blob, fileName);
  };

  return (
    <div className="modal-overlay z-60" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ zIndex: 60 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold truncate max-w-xs">{fileName}</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-gray-100">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {loading && <LoadingSpinner size="lg" />}
          {!loading && !url && <p className="text-[var(--color-text-muted)]">File not found.</p>}
          {!loading && url && fileType.startsWith('image/') && (
            <img src={url} alt={fileName} className="max-w-full max-h-full object-contain rounded-lg" />
          )}
          {!loading && url && fileType === 'application/pdf' && (
            <div className="w-full h-full flex flex-col items-center gap-4">
              <iframe src={url} className="w-full h-96 rounded-lg border" title={fileName} />
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
