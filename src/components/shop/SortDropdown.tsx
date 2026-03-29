'use client';

import { useState, useRef, useEffect } from 'react';

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption; icon: string }[] = [
  { label: 'Price (Low to High)', value: 'price-asc', icon: 'arrow_upward' },
  { label: 'Price (High to Low)', value: 'price-desc', icon: 'arrow_downward' },
  { label: 'Name (A–Z)', value: 'name-asc', icon: 'sort_by_alpha' },
  { label: 'Name (Z–A)', value: 'name-desc', icon: 'sort_by_alpha' },
];

export function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = SORT_OPTIONS.find(opt => opt.value === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-500">{selectedOption.icon}</span>
        {selectedOption.label}
        <span className="material-symbols-outlined text-[16px] text-slate-500 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-10 animate-in fade-in slide-in-from-top-2 focus:outline-none">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                sortBy === option.value ? 'font-bold text-primary bg-primary/5' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>{option.label}</span>
              {sortBy === option.value && (
                <span className="material-symbols-outlined text-[16px] text-primary">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
