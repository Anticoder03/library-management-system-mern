import { useCallback, useState } from 'react';
import { Download, FileBarChart } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { downloadFile } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { DataTable, ErrorState, Loader, PageHeader } from '../../components/ui.jsx';
import { formatCurrency, formatDate } from '../../utils/format.js';

const reports = [
  { key: 'borrowing', label: 'Borrowing', endpoint: '/reports/borrowing', filename: 'borrowing-report.csv', description: 'All loans with issue, due and return dates' },
  { key: 'overdue', label: 'Overdue', endpoint: '/reports/overdue', filename: 'overdue-report.csv', description: 'Currently overdue loans with estimated fines' },
  { key: 'fines', label: 'Fines', endpoint: '/reports/fines', filename: 'fines-report.csv', description: 'Fine records and payment status' },
  { key: 'books', label: 'Books', endpoint: '/reports/books', filename: 'books-report.csv', description: 'Complete library catalog' },
  { key: 'members', label: 'Members', endpoint: '/reports/members', filename: 'members-report.csv', description: 'Registered members and their details' },
  { key: 'popular-books', label: 'Popular Books', endpoint: '/reports/popular-books', filename: 'popular-books-report.csv', description: 'Most borrowed titles of all time' },
];

const columnsFor = (key) => {
  const common = Object.keys({});
  const map = {
    borrowing: ['borrowId', 'bookTitle', 'memberName', 'issueDate', 'dueDate', 'returnDate', 'status', 'daysLate'],
    overdue: ['bookTitle', 'memberName', 'memberEmail', 'dueDate', 'daysOverdue', 'estimatedFine'],
    fines: ['memberName', 'bookTitle', 'amount', 'reason', 'status', 'createdAt', 'paidAt'],
    books: ['title', 'author', 'isbn', 'category', 'totalCopies', 'availableCopies', 'shelfLocation'],
    members: ['name', 'email', 'studentId', 'role', 'status', 'membershipDate'],
    'popular-books': ['title', 'author', 'timesBorrowed', 'totalCopies'],
  };
  return (map[key] || []).map((field) => ({
    key: field,
    label: field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
    render: (row) => {
      const value = row[field];
      if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('fine')) return formatCurrency(value);
      if (field.toLowerCase().includes('date')) return formatDate(value);
      return value ?? '—';
    },
  })).concat(common);
};

export const Reports = () => {
  const [active, setActive] = useState(reports[0].key);
  const report = reports.find((item) => item.key === active);

  const fetchReport = useCallback(() => api.get(report.endpoint), [report.endpoint]);
  const { data, loading, error, refresh } = useFetch(fetchReport);

  const download = async () => {
    try {
      await downloadFile(`${report.endpoint}?format=csv`, report.filename);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="Insights"
        title="Reports & Analytics"
        subtitle="Export detailed reports for informed library decisions."
        actions={
          <button className="btn-primary" onClick={download}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {reports.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={`rounded-xl border p-3 text-left transition ${
              active === item.key
                ? 'border-brand-400 bg-brand-50 shadow-sm'
                : 'border-ink-100 bg-white hover:border-brand-200'
            }`}
          >
            <FileBarChart className={`h-4 w-4 ${active === item.key ? 'text-brand-600' : 'text-ink-400'}`} />
            <p className="mt-2 text-xs font-bold text-ink-800">{item.label}</p>
          </button>
        ))}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">{report.label} report</h2>
          <p className="text-xs text-ink-500">{report.description} · {data?.meta?.count || 0} records</p>
        </div>
        {error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading ? (
          <Loader compact />
        ) : (
          <DataTable columns={columnsFor(active)} rows={data?.data} emptyText="No records in this report" />
        )}
      </div>
    </>
  );
};

export default Reports;
