import { useState, useEffect, KeyboardEvent } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import type { FieldConfig } from '../types';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FieldConfig[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  initialData?: Record<string, unknown>;
  submitLabel?: string;
}

export default function FormModal({
  open,
  onClose,
  title,
  fields,
  onSubmit,
  initialData,
  submitLabel = 'Save',
}: FormModalProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      const defaults: Record<string, unknown> = {};
      fields.forEach(f => {
        if (initialData && initialData[f.name] !== undefined) {
          defaults[f.name] = initialData[f.name];
        } else if (f.defaultValue !== undefined) {
          defaults[f.name] = f.defaultValue;
        } else if (f.type === 'checkbox') {
          defaults[f.name] = false;
        } else if (f.type === 'number') {
          defaults[f.name] = '';
        } else {
          defaults[f.name] = '';
        }
      });
      setValues(defaults);
      setErrors({});
    }
  }, [open, initialData, fields]);

  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (name: string, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    fields.forEach(f => {
      if (f.required && !values[f.name] && values[f.name] !== 0 && values[f.name] !== false) {
        newErrors[f.name] = true;
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const processed: Record<string, unknown> = {};
      fields.forEach(f => {
        if (f.type === 'number') {
          processed[f.name] = values[f.name] === '' ? 0 : Number(values[f.name]);
        } else {
          processed[f.name] = values[f.name];
        }
      });
      await onSubmit(processed);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderField = (field: FieldConfig) => {
    const val = values[field.name];
    const hasError = errors[field.name];
    const baseClass = `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)] ${
      hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
    }`;

    switch (field.type) {
      case 'select':
        return (
          <select
            value={String(val ?? '')}
            onChange={e => handleChange(field.name, e.target.value)}
            className={baseClass}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(val)}
              onChange={e => handleChange(field.name, e.target.checked)}
              className="w-4 h-4 accent-[var(--color-navy)]"
            />
            <span className="text-sm text-[var(--color-text-muted)]">{field.label}</span>
          </label>
        );
      case 'textarea':
        return (
          <textarea
            value={String(val ?? '')}
            onChange={e => handleChange(field.name, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder}
            rows={3}
            className={baseClass + ' resize-none'}
          />
        );
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPasswords[field.name] ? 'text' : 'password'}
              value={String(val ?? '')}
              onChange={e => handleChange(field.name, e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder}
              className={baseClass + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            value={String(val ?? '')}
            onChange={e => handleChange(field.name, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder}
            step={field.step}
            className={baseClass}
          />
        );
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Group half-width fields */}
          {(() => {
            const rows: FieldConfig[][] = [];
            let i = 0;
            while (i < fields.length) {
              if (fields[i].half && fields[i + 1]?.half) {
                rows.push([fields[i], fields[i + 1]]);
                i += 2;
              } else {
                rows.push([fields[i]]);
                i++;
              }
            }
            return rows.map((row, ri) => (
              <div key={ri} className={row.length === 2 ? 'flex gap-3' : ''}>
                {row.map(field => (
                  <div key={field.name} className={row.length === 2 ? 'flex-1' : ''}>
                    {field.type !== 'checkbox' && (
                      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                        {field.label}
                        {field.required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
                      </label>
                    )}
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="text-xs text-[var(--color-danger)] mt-1">Required</p>
                    )}
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-[var(--color-navy)] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <LoadingSpinner size="sm" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
