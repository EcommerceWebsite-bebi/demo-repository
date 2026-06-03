"use client";

import ProductCard from "./ProductCard";
import { useApp } from "./AppContext";

export default function ProductGrid() {
	const { products, setActiveProductDetail } = useApp();

	const displayProducts = products.slice(0, 8).map((p) => ({
		id: p.id.toString(),
		title: p.name,
		price: `${p.price.toLocaleString('vi-VN')} đ`,
		img: p.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg",
		tag: p.is_customizable === 1 ? "Custom" : undefined,
		raw: p,
	}));

	return (
		<section className="py-stack-xl px-margin-x">
			<div className="flex flex-col items-center gap-4 mb-16 sm:relative sm:flex-row sm:items-end sm:justify-center">
				<span className="text-xs text-gray-500 uppercase sm:absolute sm:left-0">NEW ARRIVALS</span>
				<h2 className="text-3xl font-semibold text-center">All Products</h2>
				<a className="text-sm border-b border-black pb-1 hover:opacity-50 sm:absolute sm:right-0" href="/shop">VIEW ALL</a>
			</div>
			{displayProducts.length === 0 ? (
				<div className="flex items-center justify-center py-20 text-gray-500 border border-gray-200 bg-white">
					<p className="text-sm">No products yet. Add your products to the shop.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
					{displayProducts.map((p) => (
						<div key={p.id} className="bg-white p-6" onClick={() => setActiveProductDetail(p.raw)}>
							<ProductCard
								title={p.title}
								price={p.price}
								img={p.img}
								tag={p.tag}
							/>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

