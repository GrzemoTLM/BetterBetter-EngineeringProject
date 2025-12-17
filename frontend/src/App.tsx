import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DateFormatProvider } from './context/DateFormatContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Coupons from './components/Coupons';
import Statistics from './components/Statistics';
import AdminConsole from './components/AdminConsole';
import Help from './components/Help';
import Login from './components/Login';
import TwoFA from './components/TwoFA';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import KPICards from './components/KPICards';
import FilterBar from './components/FilterBar';
import SummaryStats from './components/SummaryStats';
import QuickActions from './components/QuickActions';
import TransactionTable from './components/TransactionTable';
import MoneyFlowBarChart from './components/MoneyFlowBarChart';
import apiService from './services/api';
import type { Transaction, TransactionSummary } from './types/finances';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [authState, setAuthState] = useState<'login' | 'register' | 'reset-password' | '2fa' | 'authenticated'>(
    'login'
  );
  const [activeView, setActiveView] = useState<
    'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help'
  >('dashboard');
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const isSuperuser = user?.is_superuser === true;

  type MoneyFlowFilters = Record<string, string>;
  const [moneyFlowFilters, setMoneyFlowFilters] = useState<MoneyFlowFilters>({});
  const [chartMode, setChartMode] = useState<'value' | 'count'>('value');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [filteredSummary, setFilteredSummary] = useState<TransactionSummary | null>(null);
  const [moneyFlowLoading, setMoneyFlowLoading] = useState(false);
  const [moneyFlowError, setMoneyFlowError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && authState !== 'authenticated') {
      setAuthState('authenticated');
    } else if (!isAuthenticated && authState === 'authenticated') {
      setAuthState('login');
    }
  }, [isAuthenticated, authState]);

  useEffect(() => {
    if (activeView === 'admin' && !isSuperuser) {
      setActiveView('dashboard');
    }
  }, [activeView, isSuperuser]);

  useEffect(() => {
    if (isAuthenticated && activeView === 'money-flow') {
      fetchMoneyFlowData(moneyFlowFilters);
    }
  }, [isAuthenticated, activeView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-page">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  const handleLoginContinue = (challengeId?: string) => {
    if (challengeId) {
      setChallengeId(challengeId);
      setAuthState('2fa');
    } else {
      setAuthState('authenticated');
    }
  };

  const handle2FAEnter = () => {
    setChallengeId(null);
    setAuthState('authenticated');
  };

  const handleRegister = (challengeId?: string) => {
    if (challengeId) {
      setChallengeId(challengeId);
      setAuthState('2fa');
    } else {
      setAuthState('authenticated');
    }
  };

  const handleResetSent = () => {
    setAuthState('login');
  };

  if (!isAuthenticated) {
    if (authState === 'login') {
      return (
        <Login 
          onContinue={handleLoginContinue}
          onNavigateToRegister={() => setAuthState('register')}
          onNavigateToReset={() => setAuthState('reset-password')}
        />
      );
    }

    if (authState === 'register') {
      return (
        <Register 
          onRegister={handleRegister}
          onBackToLogin={() => setAuthState('login')}
        />
      );
    }

    if (authState === 'reset-password') {
      return (
        <ResetPassword 
          onBackToLogin={() => setAuthState('login')}
          onResetSent={handleResetSent}
        />
      );
    }

    if (authState === '2fa' && challengeId) {
      return <TwoFA challengeId={challengeId} onEnter={handle2FAEnter} />;
    }

    return (
      <Login 
        onContinue={handleLoginContinue}
        onNavigateToRegister={() => setAuthState('register')}
        onNavigateToReset={() => setAuthState('reset-password')}
      />
    );
  }

  const handleLogout = () => {
    logout();
    setAuthState('login');
    setChallengeId(null);
  };

  const fetchMoneyFlowData = async (filters?: MoneyFlowFilters) => {
    if (!isAuthenticated) return;

    setMoneyFlowLoading(true);
    setMoneyFlowError(null);

    try {
      const [transactionsData, summaryData] = await Promise.all([
        apiService.fetchTransactions(filters),
        apiService.fetchTransactionsSummary(), // Get unfiltered summary for baseline
      ]);

      setTransactions(transactionsData);

      let filtered = summaryData;

      if (filters && Object.keys(filters).length > 0) {
        const totalDeposited = transactionsData
          .filter((t) => t.transaction_type === 'DEPOSIT')
          .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

        const totalWithdrawn = transactionsData
          .filter((t) => t.transaction_type === 'WITHDRAWAL')
          .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);

        filtered = {
          total_deposited: totalDeposited,
          total_withdrawn: totalWithdrawn,
          net_deposits: totalDeposited - totalWithdrawn,
          total_transactions: transactionsData.length,
        };

        setFilteredSummary(filtered);
      } else {
        setSummary({
          ...summaryData,
          total_transactions: transactionsData.length,
        });
        setFilteredSummary(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load money flow data';
      setMoneyFlowError(errorMessage);
    } finally {
      setMoneyFlowLoading(false);
    }
  };

  const handleApplyFilters = (filters: MoneyFlowFilters) => {
    setMoneyFlowFilters(filters);
    fetchMoneyFlowData(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters: MoneyFlowFilters = {};
    setMoneyFlowFilters(emptyFilters);
    fetchMoneyFlowData(emptyFilters);
  };

  const handleTransactionSuccess = () => {
    fetchMoneyFlowData(moneyFlowFilters);
  };

  const handleLanguageChange = async () => {
    try {
      const settings = await apiService.getSettings();
      console.log('Settings refreshed after language change:', settings);
    } catch (err) {
      console.error('Failed to refresh settings after language change:', err);
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        onLanguageChange={handleLanguageChange}
      />
      <main className="ml-[260px] bg-background-page min-h-screen p-6 flex flex-col gap-6">
        {activeView === 'dashboard' ? (
          <Dashboard />
        ) : activeView === 'settings' ? (
          <Settings />
        ) : activeView === 'coupons' ? (
          <Coupons />
        ) : activeView === 'statistics' ? (
          <Statistics />
        ) : activeView === 'admin' ? (
          <AdminConsole />
        ) : activeView === 'help' ? (
          <Help />
        ) : (
          <>
            {/* Header Section */}
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-6">
                Money Flow
              </h1>
              {summary && <KPICards summary={summary} />}
            </div>

            {/* Filter Bar */}
            <div>
              <FilterBar
                filters={moneyFlowFilters}
                onFiltersChange={handleApplyFilters}
                onClearFilters={handleClearFilters}
                uniqueBookmakers={[...new Set(transactions.map(t => t.bookmaker).filter(Boolean))] as string[]}
                transactions={transactions}
                filteredSummary={filteredSummary}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-6">
              <div className="flex flex-col gap-6">
                <SummaryStats summary={filteredSummary || summary} />
              </div>

              <div>
                <QuickActions onTransactionSuccess={handleTransactionSuccess} />
              </div>
            </div>
            <div className="bg-background-paper rounded-md shadow-card p-4 flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-text-primary mb-1">
                  Money Flow chart mode
                </h2>
                <p className="text-xs text-text-secondary">
                  Switch between total value and transaction count
                </p>
              </div>
              <div className="inline-flex rounded-full bg-background-table-header p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setChartMode('value')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    chartMode === 'value'
                      ? 'bg-primary-main text-primary-contrast shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  Value
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('count')}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    chartMode === 'count'
                      ? 'bg-primary-main text-primary-contrast shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  Count
                </button>
              </div>
            </div>

            <div className="mb-6">
              <MoneyFlowBarChart
                transactions={transactions}
                mode={chartMode}
              />
            </div>

            <div className="mb-6">
              <TransactionTable
                transactions={transactions}
                loading={moneyFlowLoading}
                error={moneyFlowError}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-background-paper rounded-md p-6 shadow-card">
                <h3 className="text-xl font-medium text-text-primary mb-4">Alerts</h3>
                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">
                    No pending alerts at this time.
                  </div>
                </div>
              </div>

              <div className="bg-background-paper rounded-md p-6 shadow-card">
                <h3 className="text-xl font-medium text-text-primary mb-4">
                  Reconciliation
                </h3>
                <div className="space-y-2">
                  <div className="text-sm text-text-secondary">
                    All transactions reconciled.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <DateFormatProvider>
          <CurrencyProvider>
            <AppContent />
          </CurrencyProvider>
        </DateFormatProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
