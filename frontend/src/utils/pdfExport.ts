import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, TransactionSummary } from '../types/finances';

interface ExportData {
  filteredSummary: TransactionSummary | null;
  transactions: Transaction[];
  filters: {
    dateFrom?: string;
    dateTo?: string;
    bookmaker?: string;
    transactionType?: string;
  };
  formatDate: (date: string) => string;
}

export const exportTransactionsToPDF = (data: ExportData) => {
  const { filteredSummary, transactions, filters, formatDate } = data;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Transaction Report', 14, 22);

  doc.setFontSize(10);
  doc.text(`Export Date: ${formatDate(new Date().toISOString())}`, 14, 30);

  let yPosition = 40;

  if (Object.keys(filters).length > 0) {
    doc.setFontSize(12);
    doc.text('Applied Filters:', 14, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    if (filters.dateFrom) {
      doc.text(`Date From: ${formatDate(filters.dateFrom)}`, 14, yPosition);
      yPosition += 5;
    }

    if (filters.dateTo) {
      doc.text(`Date To: ${formatDate(filters.dateTo)}`, 14, yPosition);
      yPosition += 5;
    }

    if (filters.bookmaker) {
      doc.text(`Bookmaker: ${filters.bookmaker}`, 14, yPosition);
      yPosition += 5;
    }

    if (filters.transactionType) {
      doc.text(`Type: ${filters.transactionType}`, 14, yPosition);
      yPosition += 5;
    }

    yPosition += 5;
  }

  if (filteredSummary) {
    doc.setFontSize(14);
    doc.text('Filtered Summary Results', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.text(`Total Deposited: ${filteredSummary.total_deposited} PLN`, 14, yPosition);
    yPosition += 5;
    doc.text(`Total Withdrawn: ${filteredSummary.total_withdrawn} PLN`, 14, yPosition);
    yPosition += 5;
    doc.text(`Net Deposits: ${filteredSummary.net_deposits} PLN`, 14, yPosition);
    yPosition += 10;

    if (filteredSummary.by_bookmaker && filteredSummary.by_bookmaker.length > 0) {
      doc.setFontSize(12);
      doc.text('By Bookmaker:', 14, yPosition);
      yPosition += 6;

      const bookmakerData = filteredSummary.by_bookmaker.map(item => [
        item.bookmaker,
        item.count.toString(),
        `${item.amount} PLN`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Bookmaker', 'Count', 'Amount']],
        body: bookmakerData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    if (filteredSummary.by_date && filteredSummary.by_date.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('By Date:', 14, yPosition);
      yPosition += 6;

      const dateData = filteredSummary.by_date.map(item => [
        formatDate(item.date),
        item.count.toString(),
        `${item.amount} PLN`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Count', 'Amount']],
        body: dateData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: 14 }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  if (transactions.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.text('Recent Transactions (Last 10)', 14, yPosition);
    yPosition += 8;

    const transactionData = transactions.slice(0, 10).map(transaction => [
      formatDate(transaction.created_at),
      transaction.bookmaker || 'N/A',
      transaction.transaction_type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal',
      `${transaction.amount} ${transaction.currency || 'PLN'}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Bookmaker', 'Type', 'Amount']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 14 }
    });
  }

  const fileName = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
