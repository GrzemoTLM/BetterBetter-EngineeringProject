import { useState, useEffect } from 'react';
import { CheckCircle2, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '../types/finances';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useCurrency } from '../hooks/useCurrency';

interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string | null;
}

const TransactionTable = ({ transactions, loading, error }: TransactionTableProps) => {
  const { formatDate } = useDateFormatter();
  const { formatCurrency } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to page 1 when transactions change
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const formatTransactionType = (type: string) => {
    return type === 'DEPOSIT' ? 'Deposit' : type === 'WITHDRAWAL' ? 'Withdrawal' : type;
  };


  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="bg-background-paper rounded-md shadow-card p-8 text-center">
        <p className="text-text-secondary">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-paper rounded-md shadow-card p-8 text-center">
        <p className="text-status-error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-background-paper rounded-md shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header">
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Date
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Bookmaker
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Type
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Amount
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Currency
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Status
              </th>
              <th className="px-4 py-4 text-left text-sm font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-border-light hover:bg-[#FAFAFA] transition-colors"
                >
                  <td className="px-4 py-4 text-sm text-text-primary align-middle">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary align-middle">
                    <span className="inline-block px-2 py-1 bg-background-table-header rounded text-xs">
                      {transaction.bookmaker || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary align-middle">
                    {formatTransactionType(transaction.transaction_type)}
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary align-middle">
                    {formatCurrency(parseFloat(transaction.amount))}
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary align-middle">
                    {transaction.currency || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm align-middle">
                    <CheckCircle2
                      size={20}
                      className="text-status-success inline-block"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm align-middle">
                    <div className="flex items-center gap-2">
                      <Edit2
                        size={16}
                        className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                      />
                      <Trash2
                        size={16}
                        className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {transactions.length > 0 && totalPages > 1 && (
        <div className="px-4 py-4 border-t border-border-light bg-background-table-header flex items-center justify-between">
          <div className="text-sm text-text-secondary">
            Showing {startIndex + 1}-{Math.min(endIndex, transactions.length)} of {transactions.length} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentPage === 1
                  ? 'text-text-disabled cursor-not-allowed bg-background-input'
                  : 'text-text-primary hover:bg-background-input bg-background-paper border border-border-light'
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="px-3 py-1.5 text-sm font-medium text-text-primary bg-background-paper border border-border-light rounded-md">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                currentPage === totalPages
                  ? 'text-text-disabled cursor-not-allowed bg-background-input'
                  : 'text-text-primary hover:bg-background-input bg-background-paper border border-border-light'
              }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;

