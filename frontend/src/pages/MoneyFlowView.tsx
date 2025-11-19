import React from "react";
import { AddTransactionModal, AddBookmakerAccountModal } from '../components';

const MoneyFlowView: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = React.useState(false);

  return (
    <div>
      <h1>Money Flow</h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button type="button" onClick={() => setIsAddOpen(true)}>Add Transaction</button>
        <button type="button" onClick={() => setIsAddAccountOpen(true)}>Add Bookmaker Account</button>
      </div>
      {isAddOpen && (
        <AddTransactionModal onClose={() => setIsAddOpen(false)} onSuccess={() => console.log('Transaction created - refresh table here later')} />
      )}
      {isAddAccountOpen && (
        <AddBookmakerAccountModal onClose={() => setIsAddAccountOpen(false)} onSuccess={() => console.log('Account added - refresh accounts list later')} />
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
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bookmaker</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Fee</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8}>No data</td>
              </tr>
            </tbody>
          </table>
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
