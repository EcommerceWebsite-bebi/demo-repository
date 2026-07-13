interface DailyHighlightItem {
	label: string;
	value: string;
	note: string;
	icon: string;
}

interface DailyHighlightsProps {
	items: DailyHighlightItem[];
}

export default function DailyHighlights({ items }: DailyHighlightsProps) {
	return (
		<section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => (
				<div
					key={item.label}
					className="rounded-md border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
				>
					<span className="material-symbols-outlined text-2xl text-gray-500">{item.icon}</span>
					<div className="mt-4 text-xs font-semibold uppercase text-gray-500">{item.label}</div>
					<div className="mt-2 text-xl font-semibold text-gray-900">{item.value}</div>
					<p className="mt-2 text-sm text-gray-600">{item.note}</p>
				</div>
			))}
		</section>
	);
}
