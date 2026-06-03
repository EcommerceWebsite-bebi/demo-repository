"use client";

interface ShopPaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

export default function ShopPagination({
	currentPage,
	totalPages,
	onPageChange,
}: ShopPaginationProps) {
	if (totalPages <= 1) return null;

	const pages: number[] = [];
	for (let i = 1; i <= totalPages; i++) {
		pages.push(i);
	}

	return (
		<div className="flex items-center justify-center gap-2 pt-8">
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<span className="material-symbols-outlined text-base">chevron_left</span>
			</button>

			{pages.map((page) => (
				<button
					key={page}
					onClick={() => onPageChange(page)}
					className={`flex items-center justify-center w-10 h-10 rounded-md text-sm font-semibold transition-colors ${
						page === currentPage
							? "bg-black text-white"
							: "border border-gray-200 bg-white text-gray-600 hover:text-black"
					}`}
				>
					{page}
				</button>
			))}

			<button
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-200 bg-white text-gray-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			>
				<span className="material-symbols-outlined text-base">chevron_right</span>
			</button>
		</div>
	);
}
