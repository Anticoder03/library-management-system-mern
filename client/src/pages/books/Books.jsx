import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookPlus, Grid2X2, List, SlidersHorizontal } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { BookCard } from '../../components/BookCard.jsx';
import {
  DataTable,
  EmptyState,
  ErrorState,
  Loader,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Toggle,
} from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../../components/ui.jsx';

export const Books = () => {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get('search') || '');
  const [availability, setAvailability] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('-createdAt');
  const [view, setView] = useState('grid');
  const [reserveBook, setReserveBook] = useState(null);
  const [reserving, setReserving] = useState(false);
  const debouncedSearch = useDebounce(search, 400);
  const { isStaff, isMember } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, availability, category, sort]);

  const fetchBooks = useCallback(
    () =>
      api
        .get('/books', {
          params: {
            page,
            limit: 12,
            search: debouncedSearch || undefined,
            availability,
            category,
            sort,
          },
        })
        .then((data) => data),
    [page, debouncedSearch, availability, category, sort]
  );
  const { data, loading, error, refresh } = useFetch(fetchBooks);

  const categoriesFetch = useCallback(() => api.get('/categories').then((d) => d.data), []);
  const { data: categories } = useFetch(categoriesFetch);

  const submitReservation = async () => {
    setReserving(true);
    try {
      await api.post('/reservations', { book: reserveBook._id });
      toast.success(`You've been added to the reservation queue for "${reserveBook.title}"`);
      setReserveBook(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReserving(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Book',
      render: (book) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <span className="text-sm font-bold">{book.title[0]}</span>
          </div>
          <div>
            <p className="font-bold text-ink-900">{book.title}</p>
            <p className="text-xs text-ink-500">{book.author}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (book) => book.category?.name || '—' },
    { key: 'isbn', label: 'ISBN', render: (book) => book.isbn || '—' },
    { key: 'copies', label: 'Availability', render: (book) => <Badge status={book.availableCopies > 0 ? 'available' : 'unavailable'} /> },
    { key: 'publicationYear', label: 'Year' },
    { key: 'shelfLocation', label: 'Shelf', render: (book) => book.shelfLocation || '—' },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Library"
        title="Book Catalog"
        subtitle={`Browse ${data?.meta?.total || 0} books in the library collection.`}
        actions={
          isStaff ? (
            <button className="btn-primary" onClick={() => navigate('/books/new')}>
              <BookPlus className="h-4 w-4" /> Add Book
            </button>
          ) : null
        }
      />

      <div className="card mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by title, author, ISBN or publisher…"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <select
                className="input !w-auto !py-2.5 !pl-9 text-xs"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <select className="input !w-auto !py-2.5 text-xs" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="-createdAt">Newest first</option>
              <option value="title">Title A–Z</option>
              <option value="author">Author A–Z</option>
              <option value="-publicationYear">Latest publication</option>
              <option value="availableCopies">Most available</option>
            </select>
            <Toggle checked={availability} onChange={setAvailability} />
            <div className="hidden items-center rounded-xl bg-ink-100 p-1 sm:flex">
              <button
                onClick={() => setView('grid')}
                className={`rounded-lg p-1.5 ${view === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-400'}`}
                aria-label="Grid view"
              >
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`rounded-lg p-1.5 ${view === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-400'}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card"><ErrorState message={error} onRetry={refresh} /></div>
      ) : loading ? (
        <Loader label="Loading books…" />
      ) : data?.data?.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No books found"
            description="Try adjusting your search or filters to find what you're looking for."
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {data.data.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              canReserve={isMember}
              onReserve={setReserveBook}
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <DataTable
            columns={columns}
            rows={data.data}
            onRowClick={(book) => navigate(`/books/${book._id}`)}
          />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}

      {view === 'grid' && <div className="card mt-5"><Pagination meta={data?.meta} onPageChange={setPage} /></div>}

      <Modal
        open={Boolean(reserveBook)}
        onClose={() => setReserveBook(null)}
        title="Reserve this book"
        description={reserveBook?.title}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReserveBook(null)}>Cancel</button>
            <button className="btn-primary" onClick={submitReservation} disabled={reserving}>
              {reserving ? 'Reserving…' : 'Confirm reservation'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          You'll join the waiting queue. We'll notify you as soon as a copy becomes available.
        </p>
      </Modal>
    </>
  );
};

export default Books;
