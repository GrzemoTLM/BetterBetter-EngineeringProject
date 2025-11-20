import React from "react";
import { AddTransactionModal, AddBookmakerAccountModal } from '../components';
import type { Transaction, TransactionSummary } from '../types/finances';
import { apiService } from '../services/api';

const MoneyFlowView: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [summary, setSummary] = React.useState<TransactionSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 20;

  // Filter states
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [selectedBookmaker, setSelectedBookmaker] = React.useState<string>('');
  const [selectedTransactionType, setSelectedTransactionType] = React.useState<string>('');
  const [uniqueBookmakers, setUniqueBookmakers] = React.useState<string[]>([]);

  const fetchTransactions = async (filters?: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.fetchTransactions(filters);
      console.log('Fetched transactions:', data);

      // Log dates for debugging
      if (data.length > 0) {
        console.log('Transaction dates in response:');
        data.forEach(t => {
          console.log(`  ID: ${t.id}, Created: ${t.created_at}, Bookmaker: ${t.bookmaker}`);
        });
      }

      setTransactions(data);
      setCurrentPage(1);

      // Extract unique bookmakers from data
      const bookmakers = [...new Set(data.map(t => t.bookmaker).filter(Boolean))];
      setUniqueBookmakers(bookmakers as string[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (filters?: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }) => {
    try {
      const data = await apiService.fetchTransactionsSummary(filters);
      console.log('Fetched summary:', data);
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  React.useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, []);

  const handleTransactionSuccess = () => {
    console.log('Transaction created - refreshing table');
    fetchTransactions();
    fetchSummary();
  };

  const handleAccountSuccess = () => {
    console.log('Account added');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTransactionType = (type: string) => {
    return type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal';
  };

  const getBookmakerName = (transaction: Transaction): string => {
    return transaction.bookmaker || 'N/A';
  };

  const handleApplyFilters = () => {
    const filters: Record<string, string> = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (selectedBookmaker) filters.bookmaker = selectedBookmaker;
    if (selectedTransactionType) filters.transaction_type = selectedTransactionType;

    console.log('Applying filters:', filters);
    fetchTransactions(filters);
    fetchSummary(filters);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedBookmaker('');
    setSelectedTransactionType('');
    fetchTransactions();
    fetchSummary();
  };

  return (
    <div>
      <h1>Money Flow</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button type="button" onClick={() => setIsAddOpen(true)}>Add Transaction</button>
        <button type="button" onClick={() => setIsAddAccountOpen(true)}>Add Bookmaker Account</button>
      </div>
      {isAddOpen && (
        <AddTransactionModal onClose={() => setIsAddOpen(false)} onSuccess={handleTransactionSuccess} />
      )}
      {isAddAccountOpen && (
        <AddBookmakerAccountModal onClose={() => setIsAddAccountOpen(false)} onSuccess={handleAccountSuccess} />
      )}

      <section>
        <div>
          <div>
            <h2>Total Deposited</h2>
            <p>{summary?.total_deposited ?? 0} PLN</p>
          </div>
          <div>
            <h2>Total Withdrawn</h2>
            <p>{summary?.total_withdrawn ?? 0} PLN</p>
          </div>
          <div>
            <h2>Net Deposits</h2>
            <p>{summary?.net_deposits ?? 0} PLN</p>
          </div>
          <div>
            <h2>Balance</h2>
            <p>{summary?.net_deposits ?? 0} PLN</p>
          </div>
        </div>

        <div>
          <label>
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label>
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          <label>
            Bookmaker
            <select value={selectedBookmaker} onChange={(e) => setSelectedBookmaker(e.target.value)}>
              <option value="">All</option>
              {uniqueBookmakers.map((bm) => (
                <option key={bm} value={bm}>{bm}</option>
              ))}
            </select>
          </label>

          <label>
            Transaction type
            <select value={selectedTransactionType} onChange={(e) => setSelectedTransactionType(e.target.value)}>
              <option value="">All</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </select>
          </label>

          <button type="button" onClick={handleApplyFilters}>Apply filters</button>
          <button type="button" onClick={handleClearFilters}>Clear filters</button>
        </div>
      </section>

      <section>
        <div>
          <h2>Deposited vs Withdrawn</h2>
          <div>
            <p>Deposited: {summary?.total_deposited ?? 0} PLN</p>
            <p>Withdrawn: {summary?.total_withdrawn ?? 0} PLN</p>
            <p>Net: {summary?.net_deposits ?? 0} PLN</p>
          </div>
        </div>

        {summary?.by_bookmaker && summary.by_bookmaker.length > 0 && (
          <div>
            <h2>Summary by Bookmaker</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Bookmaker</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Count</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_bookmaker.map((item) => (
                  <tr key={item.bookmaker_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{item.bookmaker}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.count}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.amount} PLN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {summary?.by_date && summary.by_date.length > 0 && (
          <div>
            <h2>Summary by Date</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Count</th>
                  <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_date.map((item) => (
                  <tr key={item.date} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{item.date}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.count}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.amount} PLN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div>
          <header>
            <h2>Balance over time (by bookmaker)</h2>
            <div>
              <label>
                <input type="checkbox" /> Stacked
              </label>
              <label>
                <input type="checkbox" /> Separate
              </label>
            </div>
          </header>

          <div>
            <p>Balance</p>
            <p>Deposited</p>
            <p>Withdrawn</p>
            <p>Balance</p>
            <p>Net</p>
          </div>

          <div>
            <p>Chart placeholder</p>
          </div>

          <footer>
            <button type="button">Deposit</button>
            <button type="button">Withdraw</button>
            <button type="button">Details</button>
          </footer>
        </div>

        <aside>
          <h2>Quick actions</h2>
          <div>
            <button type="button">Add bookmaker</button>
            <button type="button">Deposit</button>
            <button type="button">Withdraw</button>
            <button type="button">Transfer</button>
          </div>
        </aside>
      </section>

      <section>
        <div>
          <h2>Recent Transactions (Last 10)</h2>
          {loading && <p>Loading transactions...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          {!loading && !error && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Bookmaker</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '12px', borderBottom: '2px solid #ddd' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: '#999' }}>No transactions</td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{formatDate(transaction.created_at)}</td>
                        <td style={{ padding: '12px' }}>{getBookmakerName(transaction)}</td>
                        <td style={{ padding: '12px' }}>{formatTransactionType(transaction.transaction_type)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>{transaction.amount}</td>
                        <td style={{ padding: '12px' }}>{transaction.currency || 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {transactions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9f9f9', marginTop: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ padding: '8px 12px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>
                    <span style={{ padding: '8px 12px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ padding: '8px 12px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside>
          <section>
            <h2>Alerts</h2>
            <p>No alerts</p>
          </section>

          <section>
            <h2>Reconciliation</h2>
            <p>No pending items</p>
          </section>

          <div>
            <button type="button">Export</button>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default MoneyFlowView;
