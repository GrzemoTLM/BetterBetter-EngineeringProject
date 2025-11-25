import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../context/LanguageContextDefine';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locale: string) => Promise<void>;
}

const LanguageModal: React.FC<LanguageModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const { language: currentLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map locale to language code
  const localeToLanguage = (locale: string): Language => {
    if (locale && locale.startsWith('pl')) return 'pl';
    return 'en';
  };

  // Map language code to locale
  const languageToLocale = (lang: Language): string => {
    return lang === 'pl' ? 'pl-PL' : 'en-US';
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(currentLanguage);
      setError(null);
    }
  }, [isOpen, currentLanguage]);

  const languages = [
    { value: 'pl' as Language, label: 'Polski', flag: '🇵🇱' },
    { value: 'en' as Language, label: 'English', flag: '🇬🇧' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const locale = languageToLocale(selectedLanguage);
      await onSave(locale);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save language');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Język / Language</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {languages.map((lang) => (
            <label
              key={lang.value}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedLanguage === lang.value
                  ? 'border-primary-main bg-blue-50'
                  : 'border-border-light hover:border-border-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="language"
                  value={lang.value}
                  checked={selectedLanguage === lang.value}
                  onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  className="w-4 h-4"
                />
                <div>
                  <span className="text-2xl mr-2">{lang.flag}</span>
                  <span className="font-medium text-text-primary">{lang.label}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedLanguage === currentLanguage}
            className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;

