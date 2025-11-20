import React from "react";
import { AddTransactionModal, AddBookmakerAccountModal } from '../components';
import type { Transaction } from '../types/finances';
import { apiService } from '../services/api';

const MoneyFlowView: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.fetchTransactions();
      setTransactions(data.slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionSuccess = () => {
    console.log('Transaction created - refreshing table');
    fetchTransactions();
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
            <h2>Total</h2>
            <p></p>
          </div>
          <div>
            <h2>Total Withdrawn</h2>
            <p></p>
          </div>
          <div>
            <h2>Net Cashflow</h2>
            <p></p>
          </div>
          <div>
            <h2>Current Balance</h2>
            <p></p>
          </div>
        </div>

        <div>
          <label>
            Date range
            <select>
              <option value="">Select…</option>
            </select>
          </label>

          <label>
            Bookmaker
            <select>
              <option value="">All</option>
            </select>
          </label>

          <label>
            Transaction type
            <select>
              <option value="">All</option>
            </select>
          </label>

          <label>
            Status
            <select>
              <option value="">All</option>
            </select>
          </label>

          <button type="button">Apply filters</button>
        </div>
      </section>

      <section>
        <div>
          <h2>Deposited vs Withdrawn</h2>
          <div>
            <p>Deposited</p>
            <p>Withdrawn</p>
            <p>Balance</p>
            <p>Net</p>
          </div>
        </div>

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
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bookmaker</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No transactions</td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.created_at)}</td>
                      <td>{getBookmakerName(transaction)}</td>
                      <td>{formatTransactionType(transaction.transaction_type)}</td>
                      <td>{transaction.amount}</td>
                      <td>{transaction.currency || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
