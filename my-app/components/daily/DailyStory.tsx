interface DailyStoryEntry {
	time: string;
	title: string;
	text: string;
}

interface DailyStoryProps {
	entries: DailyStoryEntry[];
	title: string;
	subtitle: string;
}

export default function DailyStory({ entries, title, subtitle }: DailyStoryProps) {
	return (
		<div className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
			<h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
			<p className="mt-2 text-sm text-gray-600">{subtitle}</p>
			<div className="mt-8 space-y-8">
				{entries.map((entry, index) => (
					<div key={entry.time} className="flex gap-6">
						<div className="flex flex-col items-center">
							<div className="h-2 w-2 rounded-full bg-gray-900" />
							{index !== entries.length - 1 && <div className="mt-3 h-full w-px bg-gray-200" />}
						</div>
						<div className="flex-1">
							<div className="text-xs font-semibold uppercase text-gray-500">{entry.time}</div>
							<h3 className="mt-2 text-lg font-semibold text-gray-900">{entry.title}</h3>
							<p className="mt-2 text-sm text-gray-600">{entry.text}</p>
							<div className="mt-4 h-28 w-full rounded-md border border-gray-200 bg-gray-100">
								<div className="flex h-full items-end p-4 text-xs font-semibold uppercase text-gray-500">
									Canva Shot
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
