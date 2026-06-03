"use client";

import ProductCard from "../ProductCard";
import { useApp, Product } from "../AppContext";

interface ShopProduct {
	id: string;
	title: string;
	price: string;
	img: string;
	tag?: string;
	raw: Product;
}

interface ShopProductGridProps {
	products: ShopProduct[];
}

export default function ShopProductGrid({ products }: ShopProductGridProps) {
	const { setActiveProductDetail } = useApp();

	if (products.length === 0) {
		return (
			<div className="flex items-center justify-center py-20 text-gray-500">
				<p className="text-sm">No products yet. Add your products to the shop.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
			{products.map((product) => (
				<div key={product.id} onClick={() => setActiveProductDetail(product.raw)} className="cursor-pointer">
					<ProductCard
						title={product.title}
						price={product.price}
						img={product.img}
						tag={product.tag}
					/>
				</div>
			))}
		</div>
	);
}
