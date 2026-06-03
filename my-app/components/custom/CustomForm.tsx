"use client";

import { useState } from "react";

interface CustomFormProps {
	prompt: string;
	style: string;
	size: string;
	onPromptChange: (val: string) => void;
	onStyleChange: (val: string) => void;
	onSizeChange: (val: string) => void;
	onCreateDesign: () => void;
	onReset: () => void;
}

export default function CustomForm({
	prompt,
	style,
	size,
	onPromptChange,
	onStyleChange,
	onSizeChange,
	onCreateDesign,
	onReset,
}: CustomFormProps) {
	return (
		<form className="space-y-4 rounded-md border border-gray-200 bg-white p-8 shadow-sm">
			<div className="flex items-center justify-between">
				<div>
					<span className="text-xs font-semibold uppercase text-gray-500">
						Primary
					</span>
					<div className="text-sm text-gray-600">Create your design</div>
				</div>
				<button
					type="button"
					onClick={onCreateDesign}
					className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
				>
					Create
				</button>
			</div>

			<div>
				<label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
					Prompt
				</label>
				<textarea
					value={prompt}
					onChange={(e) => onPromptChange(e.target.value)}
					placeholder="Describe the garment, mood, materials, and any visual cues..."
					className="w-full rounded-md border border-gray-200 p-3 min-h-[120px] text-sm text-gray-700 placeholder:text-gray-400"
				/>
			</div>


			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
						Style
					</label>
					<select
						value={style}
						onChange={(e) => onStyleChange(e.target.value)}
						className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-700"
					>
						<option>Minimalist</option>
						<option>Editorial</option>
						<option>Streetwear</option>
						<option>Athletic</option>
					</select>
				</div>

				<div>
					<label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
						Size
					</label>
					<select
						value={size}
						onChange={(e) => onSizeChange(e.target.value)}
						className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-700"
					>
						<option value="small">Small</option>
						<option value="medium">Medium</option>
						<option value="large">Large</option>
					</select>
				</div>
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={onCreateDesign}
					className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
				>
					Create your design
				</button>
				<button
					type="button"
					onClick={onReset}
					className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
				>
					Reset
				</button>
			</div>
		</form>
	);
}
