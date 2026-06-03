"use client";

import { useState, useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ShopBanner from "../../components/shop/ShopBanner";
import ShopFilters from "../../components/shop/ShopFilters";
import ShopProductGrid from "../../components/shop/ShopProductGrid";
import ShopPagination from "../../components/shop/ShopPagination";

import { useApp, Product } from "../../components/AppContext";

interface ShopProduct {
	id: string;
	title: string;
	price: string;
	img: string;
	tag?: string;
	style?: string;
	sizes: string[];
	colors: string[];
	raw: Product;
}

const PRODUCTS_PER_PAGE = 40;

type SortOption = "newest" | "price-asc" | "price-desc";

export default function ShopPage() {
	const { products } = useApp();
	const [currentPage, setCurrentPage] = useState(1);
	const [sort, setSort] = useState<SortOption>("newest");
	const [filters, setFilters] = useState({
		price: null as string | null,
		style: null as string | null,
		size: null as string | null,
		color: null as string | null,
	});

	const mappedProducts = useMemo(() => {
		return products.map((p) => ({
			id: p.id.toString(),
			title: p.name,
			price: `${p.price.toLocaleString('vi-VN')} đ`,
			img: p.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg",
			tag: p.is_customizable === 1 ? "Custom" : undefined,
			style: p.category_name,
			sizes: p.sizes || [],
			colors: p.colors || [],
			raw: p,
		}));
	}, [products]);

	const filtered = useMemo(() => {
		let result = [...mappedProducts];

		if (filters.price) {
			const isRange = filters.price.includes("-");
			const isMin = filters.price.includes("+");
			if (isRange) {
				const [min, max] = filters.price.split("-").map(part => parseFloat(part.replace(/[^0-9]/g, "")));
				result = result.filter((p) => {
					const price = parseFloat(p.price.replace(/[^0-9]/g, ""));
					return price >= min && price <= max;
				});
			} else if (isMin) {
				const min = parseFloat(filters.price.replace(/[^0-9]/g, ""));
				result = result.filter((p) => {
					const price = parseFloat(p.price.replace(/[^0-9]/g, ""));
					return price >= min;
				});
			}
		}
		if (filters.style) {
			result = result.filter(
				(p) => p.style?.toLowerCase() === filters.style?.toLowerCase()
			);
		}
		if (filters.size) {
			result = result.filter((p) => p.sizes.includes(filters.size!));
		}
		if (filters.color) {
			result = result.filter((p) => p.colors.includes(filters.color!));
		}

		if (sort === "price-asc") {
			result.sort((a, b) => {
				const pa = parseFloat(a.price.replace(/[^0-9]/g, ""));
				const pb = parseFloat(b.price.replace(/[^0-9]/g, ""));
				return pa - pb;
			});
		}
		if (sort === "price-desc") {
			result.sort((a, b) => {
				const pa = parseFloat(a.price.replace(/[^0-9]/g, ""));
				const pb = parseFloat(b.price.replace(/[^0-9]/g, ""));
				return pb - pa;
			});
		}

		return result;
	}, [mappedProducts, filters, sort]);


	const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
	const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
	const currentProducts = filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

	function handleSortChange(newSort: SortOption) {
		setSort(newSort);
		setCurrentPage(1);
	}

	function handleFilterChange(
		group: keyof typeof filters,
		value: string | null
	) {
		setFilters((prev) => ({ ...prev, [group]: value }));
		setCurrentPage(1);
	}

	return (
		<div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
			<Header />
			<main>
				<ShopBanner />
				<div className="px-margin-x py-16 space-y-10">
					<ShopFilters
						sort={sort}
						filters={filters}
						onSortChange={handleSortChange}
						onFilterChange={handleFilterChange}
					/>
					<ShopProductGrid products={currentProducts} />
					<ShopPagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				</div>
			</main>
			<Footer />
		</div>
	);
}
