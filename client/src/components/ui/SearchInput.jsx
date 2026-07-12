import { Search, X } from 'lucide-react';
import { useState, useCallback } from 'react';

export default function SearchInput({ placeholder = 'Search...', onSearch, value, onChange, className = '' }) {
  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-gray-400 transition-all"
      />
      {value && (
        <button
          onClick={() => { if (onChange) onChange(''); if (onSearch) onSearch(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
