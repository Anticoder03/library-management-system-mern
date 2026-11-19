import { useCallback, useState } from 'react';
import { FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { ConfirmDialog, ErrorState, FormField, Loader, Modal, PageHeader } from '../../components/ui.jsx';

const empty = { name: '', description: '', color: '#6366f1', icon: 'BookOpen' };

export const Categories = () => {
  const fetchCategories = useCallback(() => api.get('/categories').then((d) => d.data), []);
  const { data, loading, error, refresh } = useFetch(fetchCategories);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const openForm = (category) => {
    setEditing(category || 'new');
    setForm(category ? { ...empty, ...category } : empty);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing === 'new') {
        await api.post('/categories', form);
        toast.success('Category created');
      } else {
        await api.put(`/categories/${editing._id}`, form);
        toast.success('Category updated');
      }
      setEditing(null);
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/categories/${confirm._id}`);
      toast.success('Category deleted');
      setConfirm(null);
      refresh(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        breadcrumb="Library"
        title="Categories"
        subtitle="Organize your collection into meaningful categories."
        actions={
          <button className="btn-primary" onClick={() => openForm(null)}>
            <FolderPlus className="h-4 w-4" /> New Category
          </button>
        }
      />

      {error ? (
        <div className="card"><ErrorState message={error} onRetry={refresh} /></div>
      ) : loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map((category) => (
            <div key={category._id} className="card p-5 transition hover:-translate-y-1 hover:shadow-float">
              <div className="flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                >
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost !p-2" onClick={() => openForm(category)} aria-label="Edit category">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost !p-2 !text-rose-500" onClick={() => setConfirm(category)} aria-label="Delete category">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 text-base font-bold text-ink-900">{category.name}</h3>
              <p className="mt-1 min-h-[36px] text-xs text-ink-500">{category.description || 'No description'}</p>
              <div className="mt-4 flex gap-4 border-t border-ink-100 pt-3 text-xs">
                <span><strong className="text-ink-900">{category.bookCount}</strong> <span className="text-ink-500">books</span></span>
                <span><strong className="text-emerald-600">{category.availableCount}</strong> <span className="text-ink-500">available</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Create category' : 'Edit category'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" form="category-form" className="btn-primary" disabled={busy}>Save category</button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4">
          <FormField label="Name">
            <input className="input" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </FormField>
          <FormField label="Description">
            <textarea className="input min-h-[80px]" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Color">
              <input className="input h-11 cursor-pointer p-1" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
            </FormField>
            <FormField label="Icon name">
              <input className="input" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
            </FormField>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete category?"
        message={`Categories containing books cannot be deleted. "${confirm?.name}" has ${confirm?.bookCount || 0} book(s).`}
      />
    </>
  );
};

export default Categories;
