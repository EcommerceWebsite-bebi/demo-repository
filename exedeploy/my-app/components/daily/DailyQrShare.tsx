interface DailyQrShareProps {
	shareUrl: string;
	title: string;
	subtitle: string;
}

export default function DailyQrShare({ shareUrl, title, subtitle }: DailyQrShareProps) {
	return (
		<section className="grid grid-cols-1 gap-10 rounded-md border border-gray-200 bg-white p-8 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
			<div>
				<h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
				<p className="mt-2 text-sm text-gray-600">{subtitle}</p>
				<div className="mt-6 flex flex-wrap gap-3">
					<button className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-80 transition-opacity">
						Copy Link
					</button>
					<button className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
						Download
					</button>
				</div>
				<div className="mt-4 text-xs font-semibold uppercase text-gray-500">{shareUrl}</div>
			</div>
			<div className="flex flex-col items-center justify-center">
				<div className="h-44 w-44 rounded-md border border-gray-200 bg-gray-100 p-4">
					<div className="h-full w-full rounded-md bg-white" />
				</div>
				<div className="mt-3 text-xs font-semibold uppercase text-gray-500">QR Preview</div>
			</div>
		</section>
	);
}
