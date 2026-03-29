'use client';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategoryId, onSelectCategory }: CategoryFilterProps) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Categories</h3>
      <div className="space-y-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-left ${
            selectedCategoryId === null
              ? "bg-primary/10 text-primary font-semibold"
              : "text-slate-600 dark:text-slate-400 hover:bg-primary/5"
          }`}
        >
          <span className="material-symbols-outlined text-xl">grid_view</span>
          <span>All Products</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors text-left ${
              selectedCategoryId === cat.id
                ? "bg-primary/10 text-primary font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-primary/5"
            }`}
          >
            <span className="material-symbols-outlined text-xl">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
