import { Link } from 'react-router-dom';
import { BookOpenCheck, ChartNoAxesCombined, LibraryBig, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen bg-white">
    <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#111827] p-12 lg:flex">
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-brand-600/25 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 shadow-lg shadow-brand-900/40">
          <LibraryBig className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-base font-extrabold leading-tight text-white">Smart Library</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-200">Management System</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <span className="chip mb-5 bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">
          <Sparkles className="h-3.5 w-3.5" /> Modern library operations
        </span>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white">
          Everything your library needs, in one place.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          From cataloging and circulation to fines and insights — run your library with clarity and confidence.
        </p>
        <div className="mt-9 grid grid-cols-2 gap-3">
          {[
            { icon: BookOpenCheck, label: 'Circulation made simple' },
            { icon: ChartNoAxesCombined, label: 'Actionable analytics' },
            { icon: ShieldCheck, label: 'Role-based security' },
            { icon: LibraryBig, label: 'Searchable catalog' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <Icon className="h-4 w-4 shrink-0 text-brand-300" />
              <span className="text-[11px] font-semibold text-slate-200">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Smart Library. Built for modern libraries.</p>
    </div>

    <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="mb-8 lg:hidden">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <LibraryBig className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-ink-900">Smart Library</span>
          </Link>
        </div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-ink-900">{title}</h2>
        <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-7 text-center text-sm text-ink-500">{footer}</div>}
      </div>
    </div>
  </div>
);
