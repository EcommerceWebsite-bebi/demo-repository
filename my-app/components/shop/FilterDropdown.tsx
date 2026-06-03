"use client";

import { useState, useRef, useEffect } from "react";

interface FilterDropdownProps {
	label: string;
	options: string[];
	value: string | null;
	onChange: (value: string | null) => void;
	openOnHover?: boolean;
}

export default function FilterDropdown({
	label,
	options,
	value,
	onChange,
	openOnHover = false,
}: FilterDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function handleOpen() {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setIsOpen(true);
	}

	function handleClose() {
		closeTimer.current = setTimeout(() => {
			setIsOpen(false);
		}, 150);
	}

	const hoverHandlers = openOnHover
		? { onMouseEnter: handleOpen, onMouseLeave: handleClose }
		: {};

	return (
		<div ref={ref} className="relative" {...hoverHandlers}>
			<button
				onClick={openOnHover ? undefined : () => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 min-w-[140px] hover:border-gray-300 transition-colors"
			>
				<span className="flex-1 text-left truncate">
					{value || label}
					{!value && (
						<span className="text-gray-400 font-normal lowercase ml-1">							
						</span>
					)}
				</span>
				<span className="material-symbols-outlined text-base text-gray-400">
					{isOpen ? "expand_less" : "expand_more"}
				</span>
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-sm z-20 overflow-hidden">
					{options.map((opt) => {
						const active = value === opt;
						return (
							<button
								key={opt}
								onClick={() => {
									onChange(active ? null : opt);
									setIsOpen(false);
								}}
								className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
									active
										? "text-black font-semibold"
										: "text-gray-600 hover:text-black hover:bg-gray-50"
								}`}
							>
								<span
									className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
										active ? "border-black" : "border-gray-300"
									}`}
								>
									{active && (
										<span className="w-2 h-2 rounded-full bg-black" />
									)}
								</span>
								{opt}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
