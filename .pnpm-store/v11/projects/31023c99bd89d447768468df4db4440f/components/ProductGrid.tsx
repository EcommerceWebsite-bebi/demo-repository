"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import { useApp } from "./AppContext";

export default function ProductGrid() {
  const { products } = useApp();
  return <section className="content-section">
    <div className="section-heading"><h2>Đang được yêu thích</h2><Link href="/shop">Xem tất cả <ArrowRight size={17}/></Link></div>
    {products.length ? <div className="products-grid">{products.slice(0,8).map(p=><ProductCard key={p.id} id={p.id} title={p.name} price={p.price} discount_price={p.discount_price} img={p.image} altImg={p.images?.[1]} colors={p.colors} stock={p.stock}/>)}</div> : <div className="empty-products">Sản phẩm mới đang được cập nhật.</div>}
  </section>;
}
