'use client';

interface CategoryFilterProps {
    categories: Array<{ id: string; name: string; slug: string; icon: string }>;
    selected: string | null;
    onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
                onClick={() => onSelect(null)}
                className={`category-pill glass ${!selected ? 'active' : ''}`}
                style={!selected ? {} : { color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
            >
                🔥 All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(selected === cat.id ? null : cat.id)}
                    className={`category-pill glass ${selected === cat.id ? 'active' : ''}`}
                    style={selected === cat.id ? {} : { color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
                >
                    {cat.icon} {cat.name}
                </button>
            ))}
        </div>
    );
}
