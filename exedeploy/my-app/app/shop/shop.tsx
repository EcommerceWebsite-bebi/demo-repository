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
	price: number;
	discount_price?: number | null;
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
			price: p.price,
			discount_price: p.discount_price,
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
					const activePrice = (p.discount_price !== null && p.discount_price !== undefined && p.discount_price < p.price)
						? p.discount_price
						: p.price;
					return activePrice >= min && activePrice <= max;
				});
			} else if (isMin) {
				const min = parseFloat(filters.price.replace(/[^0-9]/g, ""));
				result = result.filter((p) => {
					const activePrice = (p.discount_price !== null && p.discount_price !== undefined && p.discount_price < p.price)
						? p.discount_price
						: p.price;
					return activePrice >= min;
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
				const pa = (a.discount_price !== null && a.discount_price !== undefined && a.discount_price < a.price) ? a.discount_price : a.price;
				const pb = (b.discount_price !== null && b.discount_price !== undefined && b.discount_price < b.price) ? b.discount_price : b.price;
				return pa - pb;
			});
		}
		if (sort === "price-desc") {
			result.sort((a, b) => {
				const pa = (a.discount_price !== null && a.discount_price !== undefined && a.discount_price < a.price) ? a.discount_price : a.price;
				const pb = (b.discount_price !== null && b.discount_price !== undefined && b.discount_price < b.price) ? b.discount_price : b.price;
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
