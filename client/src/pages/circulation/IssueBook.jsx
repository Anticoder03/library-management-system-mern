import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BadgeCheck, BookOpenCheck, CalendarDays, Search, UserRound } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { FormField, Loader, PageHeader, SearchInput } from '../../components/ui.jsx';
import { Avatar } from '../../components/ui.jsx';
import { addDays } from 'date-fns';

export const IssueBook = () => {
  const location = useLocation();
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [dueDate, setDueDate] = useState(addDays(new Date(), 14).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = useCallback(
    () => api.get('/members', { params: { limit: 100, search: memberQuery || undefined, status: 'active' } }),
    [memberQuery]
  );
  const { data: membersData, loading: loadingMembers } = useFetch(fetchMembers);

  const fetchBooks = useCallback(
    () =>
      api.get('/books', {
        params: { limit: 100, availability: 'available', search: bookQuery || undefined },
      }),
    [bookQuery]
  );
  const { data: booksData, loading: loadingBooks } = useFetch(fetchBooks);

  useEffect(() => {
    const preselectedBook = location.state?.bookId;
    if (preselectedBook && booksData?.data) {
      const found = booksData.data.find((book) => book._id === preselectedBook);
      if (found) setSelectedBook(found);
    }
    const preselectedMember = location.state?.memberId;
    if (preselectedMember && membersData?.data) {
      const found = membersData.data.find((member) => member._id === preselectedMember);
      if (found) setSelectedMember(found);
    }
  }, [location.state, booksData, membersData]);

  const issue = async (event) => {
    event.preventDefault();
    if (!selectedMember || !selectedBook) {
      toast.error('Select both a member and a book');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/borrow/issue', {
        book: selectedBook._id,
        member: selectedMember._id,
        dueDate: new Date(`${dueDate}T23:59:59`).toISOString(),
        notes,
      });
      toast.success(`"${selectedBook.title}" issued to ${selectedMember.name}`);
      setSelectedBook(null);
      setNotes('');
      setDueDate(addDays(new Date(), 14).toISOString().slice(0, 10));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="Circulation"
        title="Issue a Book"
        subtitle="Check out a book to an active library member."
      />

      <form onSubmit={issue} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">1. Select a member</h2>
                <p className="text-xs text-ink-500">Search active members by name, email or student ID</p>
              </div>
            </div>
            <SearchInput value={memberQuery} onChange={setMemberQuery} placeholder="Search members…" />
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {loadingMembers ? (
                <Loader compact />
              ) : membersData?.data?.length ? (
                membersData.data.map((member) => (
                  <button
                    type="button"
                    key={member._id}
                    onClick={() => setSelectedMember(member)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selectedMember?._id === member._id
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-ink-100 hover:border-brand-200 hover:bg-ink-50'
                    }`}
                  >
                    <Avatar name={member.name} src={member.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink-900">{member.name}</p>
                      <p className="truncate text-[11px] text-ink-500">{member.email} · {member.studentId || 'No ID'}</p>
                    </div>
                    {selectedMember?._id === member._id && <BadgeCheck className="h-5 w-5 text-brand-600" />}
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-ink-400">No active members found</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <BookOpenCheck className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">2. Select an available book</h2>
                <p className="text-xs text-ink-500">Only books with available copies are listed</p>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                className="input !pl-9"
                placeholder="Search books by title, author or ISBN…"
                value={bookQuery}
                onChange={(event) => setBookQuery(event.target.value)}
              />
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {loadingBooks ? (
                <Loader compact />
              ) : booksData?.data?.length ? (
                booksData.data.map((book) => (
                  <button
                    type="button"
                    key={book._id}
                    onClick={() => setSelectedBook(book)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selectedBook?._id === book._id
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-ink-100 hover:border-brand-200 hover:bg-ink-50'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <BookOpenCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink-900">{book.title}</p>
                      <p className="truncate text-[11px] text-ink-500">
                        {book.author} · {book.availableCopies} of {book.totalCopies} available
                      </p>
                    </div>
                    {selectedBook?._id === book._id && <BadgeCheck className="h-5 w-5 text-brand-600" />}
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-ink-400">No available books found</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-bold text-ink-900">3. Loan details</h2>
            <div className="space-y-4">
              <FormField label="Due date">
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    className="input !pl-9"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    required
                  />
                </div>
              </FormField>
              <FormField label="Notes (optional)">
                <textarea
                  className="input min-h-[90px]"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any notes about this loan…"
                />
              </FormField>
              <button type="submit" className="btn-primary w-full !py-3" disabled={submitting || !selectedBook || !selectedMember}>
                <BookOpenCheck className="h-4 w-4" /> {submitting ? 'Issuing…' : 'Issue book'}
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-500">Loan summary</h2>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <p className="text-ink-400">Member</p>
                <p className="font-bold text-ink-800">{selectedMember?.name || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-ink-400">Book</p>
                <p className="font-bold text-ink-800">{selectedBook?.title || 'Not selected'}</p>
              </div>
              <div>
                <p className="text-ink-400">Due date</p>
                <p className="font-bold text-ink-800">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default IssueBook;
