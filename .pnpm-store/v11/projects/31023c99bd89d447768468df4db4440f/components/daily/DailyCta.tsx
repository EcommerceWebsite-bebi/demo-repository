interface DailyCtaProps {
	kicker: string;
	title: string;
	description: string;
	href: string;
	actionLabel: string;
}

export default function DailyCta({ kicker, title, description, href, actionLabel }: DailyCtaProps) {
	return (
		<section>
			<div className="text-xs font-semibold uppercase text-gray-500">{kicker}</div>
			<h3 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h3>
			<p className="mt-2 max-w-xl text-sm text-gray-600">{description}</p>
			<a
				className="mt-6 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity"
				href={href}
			>
				{actionLabel}
				<span className="material-symbols-outlined text-base">north_east</span>
			</a>
		</section>
	);
}
