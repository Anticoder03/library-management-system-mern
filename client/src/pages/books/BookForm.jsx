import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import api, { getImageUrl } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { FormField, Loader, PageHeader } from '../../components/ui.jsx';

const emptyBook = {
  title: '',
  author: '',
  isbn: '',
  description: '',
  category: '',
  publisher: '',
  publicationYear: '',
  totalCopies: 1,
  availableCopies: 1,
  shelfLocation: '',
  language: 'English',
  tags: '',
};

export const BookForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [values, setValues] = useState(emptyBook);
  const [cover, setCover] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(() => api.get('/categories').then((d) => d.data), []);
  const { data: categories } = useFetch(fetchCategories);

  const fetchBook = useCallback(() => api.get(`/books/${id}`).then((d) => d.data), [id]);
  const { data: book, loading: loadingBook } = useFetch(fetchBook, { enabled: isEdit });

  useEffect(() => {
    if (!book) return;
    setValues({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      category: book.category?._id || book.category || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      shelfLocation: book.shelfLocation || '',
      language: book.language || 'English',
      tags: (book.tags || []).join(', '),
    });
    setPreview(book.coverImage || '');
  }, [book]);

  useEffect(() => {
    if (!cover) return undefined;
    const url = URL.createObjectURL(cover);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) formData.append(key, value);
      });
      if (cover) formData.append('coverImage', cover);

      if (isEdit) {
        await api.put(`/books/${id}`, formData);
        toast.success('Book updated successfully');
      } else {
        await api.post('/books', formData);
        toast.success('Book added to the catalog');
      }
      navigate('/books');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loadingBook) return <Loader label="Loading book…" />;

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        breadcrumb="Library"
        title={isEdit ? 'Edit book' : 'Add a new book'}
        subtitle={isEdit ? 'Update the details below and save your changes.' : 'Fill in the details to add a book to your collection.'}
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div className="card h-fit p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-500">Book cover</p>
          <div
            className="flex h-64 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink-200 bg-ink-50/60 transition hover:border-brand-400"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={getImageUrl(preview) || preview} alt="Cover preview" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-9 w-9 text-ink-300" />
                <p className="mt-2 text-xs font-semibold text-ink-500">Click to upload an image</p>
                <p className="mt-1 text-[10px] text-ink-400">JPEG, PNG, WebP, GIF · max 5 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => setCover(event.target.files?.[0] || null)}
          />
          {cover && <p className="mt-2 truncate text-xs text-ink-500">Selected: {cover.name}</p>}
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Title" className="sm:col-span-2">
              <input className="input" required value={values.title} onChange={change('title')} placeholder="e.g. The Great Gatsby" />
            </FormField>
            <FormField label="Author">
              <input className="input" required value={values.author} onChange={change('author')} placeholder="Author name" />
            </FormField>
            <FormField label="Category">
              <select className="input" required value={values.category} onChange={change('category')}>
                <option value="">Select a category</option>
                {categories?.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="ISBN">
              <input className="input" value={values.isbn} onChange={change('isbn')} placeholder="978..." />
            </FormField>
            <FormField label="Publisher">
              <input className="input" value={values.publisher} onChange={change('publisher')} placeholder="Publisher name" />
            </FormField>
            <FormField label="Publication year">
              <input className="input" type="number" min="1000" max="2100" value={values.publicationYear} onChange={change('publicationYear')} placeholder="2024" />
            </FormField>
            <FormField label="Language">
              <input className="input" value={values.language} onChange={change('language')} />
            </FormField>
            <FormField label="Total copies">
              <input className="input" type="number" min="1" required value={values.totalCopies} onChange={change('totalCopies')} />
            </FormField>
            <FormField label="Available copies">
              <input className="input" type="number" min="0" required value={values.availableCopies} onChange={change('availableCopies')} />
            </FormField>
            <FormField label="Shelf location">
              <input className="input" value={values.shelfLocation} onChange={change('shelfLocation')} placeholder="Aisle A-12" />
            </FormField>
            <FormField label="Tags" hint="Separate tags with commas" className="sm:col-span-2">
              <input className="input" value={values.tags} onChange={change('tags')} placeholder="fiction, bestseller" />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <textarea className="input min-h-[110px] resize-y" value={values.description} onChange={change('description')} placeholder="Short description of the book…" />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Save className="h-4 w-4" /> {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add book'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default BookForm;
