import React, { useState } from 'react';
import { X, Loader } from 'lucide-react';
import apiService from '../services/api';

interface TelegramConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  onConnectionSuccess: () => void;
  onDisconnectSuccess: () => void;
}

const TelegramConnectionModal: React.FC<TelegramConnectionModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  onConnectionSuccess,
  onDisconnectSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  const botUsername = (import.meta as never).env?.VITE_TELEGRAM_BOT_USERNAME || 'BetterBetter_bot';

  const handleCloseModal = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
    }

    setIsPolling(false);
    setIsLoading(false);
    setAuthCode(null);
    setExpiresAt(null);
    setError(null);
    setMessage(null);
    onClose();
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setAuthCode(null);

    try {
      await apiService.updateSettings({ notification_gate: 'telegram' });
      const codeResp = await apiService.generateTelegramAuthCode();
      const code = codeResp?.data?.code;
      const expires = codeResp?.data?.expires_at || null;

      if (!code) {
        throw new Error('Brak kodu autoryzacyjnego z serwera');
      }

      setAuthCode(code);
      setExpiresAt(expires);

      setMessage('Otwórz Telegrama, wyślij komendę /login <KOD> do bota, a my sprawdzimy połączenie...');
      setIsPolling(true);
      await pollForConnection();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się rozpocząć łączenia z Telegramem';
      setError(errorMessage);
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  const pollForConnection = async () => {
    let pollCount = 0;
    const maxPolls = 60; // ~2 min (60 * 2s)
    const pollInterval = 2000;

    const timer = setInterval(async () => {
      pollCount++;
      try {
        const status = await apiService.getTelegramConnectionStatus();
        if (status) {
          clearInterval(timer);
          setPollingTimer(null);
          setIsPolling(false);
          setMessage('Połączono z Telegramem pomyślnie!');
          setTimeout(() => {
            onConnectionSuccess();
            onClose();
          }, 1200);
        } else if (pollCount >= maxPolls) {
          clearInterval(timer);
          setPollingTimer(null);
          setIsPolling(false);
          setIsLoading(false);
          setError('Przekroczono czas oczekiwania. Spróbuj ponownie.');
        }
      } catch {
        if (pollCount >= maxPolls) {
          clearInterval(timer);
          setPollingTimer(null);
          setIsPolling(false);
          setIsLoading(false);
          setError('Nie udało się potwierdzić połączenia. Spróbuj ponownie.');
        }
      }
    }, pollInterval);

    setPollingTimer(timer);
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await apiService.updateSettings({ notification_gate: 'none' });
      setMessage('Rozłączono Telegram');
      setTimeout(() => {
        onDisconnectSuccess();
        onClose();
      }, 800);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się rozłączyć Telegrama';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            {isConnected ? 'Telegram Connected' : 'Connect to Telegram'}
          </h2>
          <button
            onClick={handleCloseModal}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            {isPolling && <Loader size={16} className="text-blue-600 animate-spin" />}
            <p className="text-sm text-blue-800">{message}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {isConnected ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">✓ You are connected to Telegram</p>
              <p className="text-xs text-green-700 mt-1">You will receive notifications via Telegram</p>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <p className="text-sm text-text-primary font-medium">Connect to Telegram Notifications</p>
              <ol className="text-xs text-text-secondary list-decimal list-inside space-y-1">
                <li>
                  Otwórz czat z botem: <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer" className="text-primary-main underline">@{botUsername}</a>
                </li>
                <li>
                  W Telegramie wyślij komendę: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">/login {authCode ?? 'KOD'}</span>
                </li>
              </ol>
              {authCode && (
                <div className="text-xs text-text-secondary">
                  Kod wygasa: {expiresAt ? new Date(expiresAt).toLocaleString() : 'wkrótce'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCloseModal}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
          >
            {isConnected ? 'Done' : 'Cancel'}
          </button>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading || isPolling}
              className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading || isPolling ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                'Generate code & connect'
              )}
            </button>
          )}
        </div>

        {!isConnected && authCode && (
          <div className="mt-4 flex items-center justify-between bg-white border border-border-light rounded-lg p-3">
            <div>
              <div className="text-xs text-text-secondary">Twój kod</div>
              <div className="font-mono text-text-primary text-sm">{authCode}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://t.me/${botUsername}`, '_blank')}
                className="px-3 py-2 border border-border-light rounded-md text-sm hover:bg-background-table-header"
              >
                Otwórz Telegram
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`/login ${authCode}`)}
                className="px-3 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
              >
                Skopiuj komendę
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramConnectionModal;
