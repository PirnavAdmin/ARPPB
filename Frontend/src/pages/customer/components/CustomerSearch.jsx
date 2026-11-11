import { Search, X } from 'lucide-react';

export function CustomerSearch({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <div className={`relative flex-1 min-w-[200px] ${className}`}>
      <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default CustomerSearch;

