import { BookOpen, MapPin, Plus, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../services/api.js';
import { Badge } from './ui.jsx';

export const BookCard = ({ book, onReserve, canReserve }) => {
  const navigate = useNavigate();
  const available = book.availableCopies > 0;

  return (
    <article className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-float">
      <div
        className="relative h-44 cursor-pointer overflow-hidden bg-gradient-to-br from-brand-100 via-violet-100 to-sky-100"
        onClick={() => navigate(`/books/${book._id}`)}
      >
        {book.coverImage ? (
          <img
            src={getImageUrl(book.coverImage)}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-14 w-14 text-brand-300/70" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <Badge status={available ? 'available' : 'unavailable'} className="!bg-white/90 !backdrop-blur" />
        </div>
        {book.category && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            {book.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button
          onClick={() => navigate(`/books/${book._id}`)}
          className="text-left text-sm font-bold leading-snug text-ink-900 line-clamp-2 hover:text-brand-600"
        >
          {book.title}
        </button>
        <p className="mt-1 text-xs text-ink-500">{book.author}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {book.availableCopies}/{book.totalCopies} copies
          </span>
          {book.shelfLocation && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5" /> {book.shelfLocation}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
            <Star className="h-3.5 w-3.5 fill-current" /> {book.publicationYear || 'N/A'}
          </span>
          {canReserve && !available && (
            <button
              onClick={() => onReserve?.(book)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800"
            >
              <Plus className="h-3.5 w-3.5" /> Reserve
            </button>
          )}
          <button
            onClick={() => navigate(`/books/${book._id}`)}
            className="text-[11px] font-bold text-ink-500 hover:text-brand-600"
          >
            View details →
          </button>
        </div>
      </div>
    </article>
  );
};
