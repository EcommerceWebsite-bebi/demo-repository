"use client";

type Props = {
	title: string;
	price: string;
	img: string;
	tag?: string;
};

export default function ProductCard({ title, price, img, tag }: Props) {
	return (
		<div className="group cursor-pointer">
			<div className="relative overflow-hidden bg-gray-100 aspect-square mb-4">
				{tag && (
					<span className="absolute top-3 right-3 z-10 rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase text-white">
						{tag}
					</span>
				)}
				<img alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={img} />
				<div className="absolute bottom-0 left-0 right-0 bg-white/70 backdrop-blur-md p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-gray-200 flex justify-between items-center">
					<span className="text-xs uppercase">QUICK ADD</span>
					<span className="material-symbols-outlined text-sm">add</span>
				</div>
			</div>
			<h3 className="text-[20px] mb-1 font-semibold">{title}</h3>
			<div className="flex justify-between items-center">
				<span className="font-bold">{price}</span>
				<button className="material-symbols-outlined text-gray-500 group-hover:text-black transition-colors">shopping_bag</button>
			</div>
		</div>
	);
}
