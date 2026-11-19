import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { FormField, Loader, PageHeader } from '../../components/ui.jsx';

const emptyMember = {
  name: '',
  email: '',
  phone: '',
  studentId: '',
  address: '',
  role: 'member',
  membershipStatus: 'active',
  membershipDate: new Date().toISOString().slice(0, 10),
  password: '',
};

export const MemberForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(emptyMember);
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const fetchMember = useCallback(() => api.get(`/members/${id}`).then((d) => d.data.member), [id]);
  const { data: member, loading } = useFetch(fetchMember, { enabled: isEdit });

  useEffect(() => {
    if (!member) return;
    setValues({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      studentId: member.studentId || '',
      address: member.address || '',
      role: member.role || 'member',
      membershipStatus: member.membershipStatus || 'active',
      membershipDate: member.membershipDate ? new Date(member.membershipDate).toISOString().slice(0, 10) : '',
      password: '',
    });
  }, [member]);

  const change = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (isEdit) delete payload.password;
      if (!payload.password) delete payload.password;
      const data = isEdit
        ? await api.put(`/members/${id}`, payload)
        : await api.post('/members', payload);
      toast.success(isEdit ? 'Member updated successfully' : 'Member registered successfully');
      if (data.data?.temporaryPassword) setTempPassword(data.data.temporaryPassword);
      else navigate('/members');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loading) return <Loader label="Loading member…" />;

  return (
    <>
      <button onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PageHeader
        breadcrumb="Management"
        title={isEdit ? 'Edit member' : 'Register a member'}
        subtitle={isEdit ? 'Update member information below.' : 'Create a library account for a new member.'}
      />

      <div className="card max-w-4xl p-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Full name">
            <input className="input" required value={values.name} onChange={change('name')} />
          </FormField>
          <FormField label="Email address">
            <input className="input" type="email" required value={values.email} onChange={change('email')} />
          </FormField>
          <FormField label="Phone number">
            <input className="input" value={values.phone} onChange={change('phone')} placeholder="+1 555 010 2000" />
          </FormField>
          <FormField label="Student ID">
            <input className="input" value={values.studentId} onChange={change('studentId')} placeholder="STU-1009" />
          </FormField>
          <FormField label="Role">
            <select className="input" value={values.role} onChange={change('role')}>
              <option value="member">Member</option>
              <option value="librarian">Librarian</option>
            </select>
          </FormField>
          <FormField label="Membership status">
            <select className="input" value={values.membershipStatus} onChange={change('membershipStatus')}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <FormField label="Membership date">
            <input className="input" type="date" value={values.membershipDate} onChange={change('membershipDate')} />
          </FormField>
          {!isEdit && (
            <FormField label="Initial password" hint="Leave blank to generate a temporary password">
              <input className="input" type="text" value={values.password} onChange={change('password')} placeholder="Auto-generated if empty" />
            </FormField>
          )}
          <FormField label="Address" className="sm:col-span-2">
            <textarea className="input min-h-[90px]" value={values.address} onChange={change('address')} />
          </FormField>

          <div className="flex justify-end gap-2 border-t border-ink-100 pt-5 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Save className="h-4 w-4" /> {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Register member'}
            </button>
          </div>
        </form>

        {tempPassword && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-800">Member created. Share these credentials:</p>
            <p className="mt-1 text-xs text-emerald-700">
              Email: <strong>{values.email}</strong> · Temporary password: <strong className="font-mono">{tempPassword}</strong>
            </p>
            <button className="btn-secondary mt-3 !py-1.5" onClick={() => navigate('/members')}>Done</button>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberForm;
