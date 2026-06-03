"use client";

import FilterDropdown from "./FilterDropdown";

type SortOption = "newest" | "price-asc" | "price-desc";

type FilterValues = {
	price: string | null;
	style: string | null;
	size: string | null;
	color: string | null;
};

interface ShopFiltersProps {
	sort: SortOption;
	filters: FilterValues;
	onSortChange: (sort: SortOption) => void;
	onFilterChange: (group: keyof FilterValues, value: string | null) => void;
}

const FILTER_GROUPS: {
	label: string;
	key: keyof FilterValues;
	options: string[];
}[] = [
	{
		label: "Price",
		key: "price",
		options: ["0 đ - 200.000 đ", "200.000 đ - 500.000 đ", "500.000 đ+"],
	},
	{
		label: "Style",
		key: "style",
		options: ["Oversize", "Basic", "Polo", "Custom"],
	},
	{
		label: "Size",
		key: "size",
		options: ["S", "M", "L", "XL"],
	},
	{
		label: "Color",
		key: "color",
		options: ["Black", "White", "Red", "Blue"],
	},
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
	{ value: "newest", label: "New Arrivals" },
	{ value: "price-asc", label: "Price ↑" },
	{ value: "price-desc", label: "Price ↓" },
];

const CHIP_COLORS: Record<string, { bg: string; text: string }> = {
	price: { bg: "bg-blue-100", text: "text-blue-800" },
	style: { bg: "bg-green-100", text: "text-green-800" },
	size: { bg: "bg-amber-100", text: "text-amber-800" },
	color: { bg: "bg-pink-100", text: "text-pink-800" },
};

export default function ShopFilters({
	sort,
	filters,
	onSortChange,
	onFilterChange,
}: ShopFiltersProps) {
	const sortDisplayValue =
		SORT_OPTIONS.find((o) => o.value === sort)?.label || null;

	const hasActiveFilters = Object.values(filters).some(Boolean);

	return (
		<div className="space-y-3">
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-xs font-semibold uppercase text-gray-500">
						You Choose:
					</span>
					{FILTER_GROUPS.map((group) => {
						const val = filters[group.key];
						if (!val) return null;
						const colors = CHIP_COLORS[group.key];
						return (
							<span
								key={group.key}
								className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}
							>
								{group.label}: {val}
								<button
									onClick={() =>
										onFilterChange(group.key, null)
									}
									className="hover:opacity-70 transition-opacity"
								>
									<span className="material-symbols-outlined text-sm">
										close
									</span>
								</button>
							</span>
						);
					})}
				</div>
			)}
			<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-3">
				{FILTER_GROUPS.map((group) => (
					<FilterDropdown
						key={group.key}
						label={group.label}
						options={group.options}
						value={filters[group.key]}
						onChange={(value) => onFilterChange(group.key, value)}
					/>
				))}
			</div>

			<FilterDropdown
				label="Sort"
				options={SORT_OPTIONS.map((o) => o.label)}
				value={sortDisplayValue}
				onChange={(val) => {
					const found = SORT_OPTIONS.find((o) => o.label === val);
					if (found) onSortChange(found.value);
				}}
				openOnHover
			/>
			</div>
		</div>
	);
}
