import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  Edit3,
  Hash,
  Landmark,
  MapPin,
  Package,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api, { getImageUrl } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge, ConfirmDialog, ErrorState, Loader, Modal, PageHeader } from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';

export const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserving, setReserving] = useState(false);

  const fetchBook = useCallback(() => api.get(`/books/${id}`).then((data) => data.data), [id]);
  const { data: book, loading, error, refresh } = useFetch(fetchBook);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted');
      navigate('/books');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  const reserve = async () => {
    setReserving(true);
    try {
      await api.post('/reservations', { book: id });
      toast.success('Reservation placed successfully');
      setReserveOpen(false);
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <Loader label="Loading book details…" />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const available = book.availableCopies > 0;
  const meta = [
    { icon: UserRound, label: 'Author', value: book.author },
    { icon: Landmark, label: 'Publisher', value: book.publisher || '—' },
    { icon: CalendarDays, label: 'Published', value: book.publicationYear || '—' },
    { icon: Hash, label: 'ISBN', value: book.isbn || '—' },
    { icon: MapPin, label: 'Shelf location', value: book.shelfLocation || '—' },
    { icon: Package, label: 'Copies', value: `${book.availableCopies} of ${book.totalCopies} available` },
  ];

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to catalog
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <div className="card overflow-hidden">
          <div className="flex h-[380px] items-center justify-center bg-gradient-to-br from-brand-50 via-violet-50 to-sky-50">
            {book.coverImage ? (
              <img src={getImageUrl(book.coverImage)} alt={book.title} className="h-full w-full object-contain p-5" />
            ) : (
              <BookOpenCheck className="h-24 w-24 text-brand-300" />
            )}
          </div>
          <div className="border-t border-ink-100 p-4">
            <Badge status={available ? 'available' : 'unavailable'} />
            <p className="mt-3 text-xs text-ink-500">
              {available ? 'This book is ready to borrow.' : `Waiting list: ${book.reservationQueue || 0} member(s)`}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <PageHeader
              breadcrumb={book.category?.name || 'Book'}
              title={book.title}
              subtitle={book.description || 'No description available for this book.'}
              actions={
                <>
                  {isStaff ? (
                    <>
                      <button className="btn-secondary" onClick={() => navigate('/issue', { state: { bookId: id } })} disabled={!available}>
                        <BookOpenCheck className="h-4 w-4" /> Issue
                      </button>
                      <button className="btn-secondary" onClick={() => navigate(`/books/${id}/edit`)}>
                        <Edit3 className="h-4 w-4" /> Edit
                      </button>
                      <button className="btn-danger !px-3" onClick={() => setConfirm(true)} aria-label="Delete book">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <button className="btn-primary" disabled={available} onClick={() => setReserveOpen(true)}>
                      Reserve this book
                    </button>
                  )}
                </>
              }
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-ink-50/70 p-3.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-ink-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            {book.tags?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span key={tag} className="chip bg-brand-50 text-brand-700">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-bold text-ink-900">Loan activity</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-extrabold text-ink-900">{book.activeBorrows || 0}</p>
                <p className="text-[11px] font-semibold uppercase text-ink-500">Currently issued</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-ink-900">{book.reservationQueue || 0}</p>
                <p className="text-[11px] font-semibold uppercase text-ink-500">In reservation queue</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-ink-900">{formatDate(book.createdAt, 'MMM yyyy')}</p>
                <p className="text-[11px] font-semibold uppercase text-ink-500">Added to library</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this book?"
        message={`This will permanently remove "${book.title}" from the catalog. Active loans cannot be deleted.`}
      />

      <Modal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        title="Reserve this book"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReserveOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={reserve} disabled={reserving}>
              {reserving ? 'Reserving…' : 'Confirm reservation'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">Join the waiting queue and we'll alert you when a copy is available.</p>
      </Modal>
    </>
  );
};

export default BookDetail;
