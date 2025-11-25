import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DateFormatProvider } from './context/DateFormatContext';
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
import BalanceChart from './components/BalanceChart';
import QuickActions from './components/QuickActions';
import TransactionTable from './components/TransactionTable';
import { apiService } from './services/api';
import type { Transaction, TransactionSummary } from './types/finances';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [authState, setAuthState] = useState<'login' | 'register' | 'reset-password' | '2fa' | 'authenticated'>(
    'login'
  );
  const [activeView, setActiveView] = useState<
    'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help'
  >('dashboard');
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Money Flow state
  const [moneyFlowFilters, setMoneyFlowFilters] = useState<{
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [filteredSummary, setFilteredSummary] = useState<TransactionSummary | null>(null);
  const [moneyFlowLoading, setMoneyFlowLoading] = useState(false);
  const [moneyFlowError, setMoneyFlowError] = useState<string | null>(null);

  // Sync authState with isAuthenticated
  useEffect(() => {
    if (isAuthenticated && authState !== 'authenticated') {
      setAuthState('authenticated');
    } else if (!isAuthenticated && authState === 'authenticated') {
      setAuthState('login');
    }
  }, [isAuthenticated, authState]);

  // Fetch money flow data when authenticated and on money-flow view
  useEffect(() => {
    if (isAuthenticated && activeView === 'money-flow') {
      fetchMoneyFlowData(moneyFlowFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeView]);

  // Show loading during auth initialization
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-page">
        <div className="text-text-primary">Loading...</div>
      </div>
    );
  }

  // Authentication flow handlers
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

  // Show authentication screens if not authenticated
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

  // Logout handler
  const handleLogout = () => {
    logout();
    setAuthState('login');
    setChallengeId(null);
  };

  // Money Flow data fetching
  const fetchMoneyFlowData = async (filters?: typeof moneyFlowFilters) => {
    if (!isAuthenticated) return;

    setMoneyFlowLoading(true);
    setMoneyFlowError(null);

    try {
      const [transactionsData, summaryData] = await Promise.all([
        apiService.fetchTransactions(filters),
        apiService.fetchTransactionsSummary(filters),
      ]);

      setTransactions(transactionsData);

      // Add total_transactions count to summary
      const enhancedSummary = {
        ...summaryData,
        total_transactions: transactionsData.length
      };


      if (filters && Object.keys(filters).length > 0) {
        setFilteredSummary(enhancedSummary);
      } else {
        setSummary(enhancedSummary);
        setFilteredSummary(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load money flow data';
      setMoneyFlowError(errorMessage);
    } finally {
      setMoneyFlowLoading(false);
    }
  };


  // Money Flow filter handlers
  const handleApplyFilters = (filters: typeof moneyFlowFilters) => {
    setMoneyFlowFilters(filters);
    fetchMoneyFlowData(filters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setMoneyFlowFilters(emptyFilters);
    fetchMoneyFlowData(emptyFilters);
  };

  const handleTransactionSuccess = () => {
    fetchMoneyFlowData(moneyFlowFilters);
  };

  // Show main app if authenticated
  return (
    <div className="min-h-screen">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
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
              {summary && <KPICards summary={filteredSummary || summary} />}
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

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              {/* Left Column - Summary Stats */}
              <div className="flex flex-col gap-6">
                <SummaryStats summary={filteredSummary || summary} />
                <BalanceChart summary={filteredSummary || summary} />
              </div>

              {/* Right Column - Quick Actions */}
              <div>
                <QuickActions onTransactionSuccess={handleTransactionSuccess} />
              </div>
            </div>

            {/* Data Table */}
            <div>
              <TransactionTable
                transactions={transactions}
                loading={moneyFlowLoading}
                error={moneyFlowError}
              />
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
      <DateFormatProvider>
        <AppContent />
      </DateFormatProvider>
    </AuthProvider>
  );
}

export default App;
