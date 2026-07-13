"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useApp } from "./AppContext";

type Props = { id: number; title: string; price: number; discount_price?: number | null; img: string; altImg?: string; colors?: string[]; stock?: number };
export default function ProductCard({ id, title, price, discount_price, img, altImg, colors = [], stock = 1 }: Props) {
  const { addToCart, setIsCartOpen } = useApp();
  const sale = discount_price != null && discount_price < price;
  const activePrice = sale ? discount_price : price;
  async function quickAdd(e: React.MouseEvent) { e.preventDefault(); await addToCart(id, 1, null, null); setIsCartOpen(true); }
  return <article className="product-card">
    <Link href={`/products/${id}`} className="product-media">
      <img src={img} alt={title} className="primary-image" />
      {altImg ? <img src={altImg} alt="" className="alternate-image" /> : null}
      {sale ? <span className="sale-tag">-{Math.round((price-activePrice)/price*100)}%</span> : null}
      <button className="heart-button" aria-label={`Yêu thích ${title}`} onClick={e => e.preventDefault()}><Heart size={19}/></button>
      {stock > 0 ? <button className="quick-add" onClick={quickAdd}><ShoppingBag size={17}/> Thêm nhanh vào giỏ</button> : <span className="sold-out">Hết hàng</span>}
    </Link>
    <div className="product-info">
      <div className="swatches">{(colors.length ? colors : ["Đen","Trắng"]).slice(0,4).map((c,i)=><span key={c} title={c} style={{background:["#111827","#f5f5f4","#9ca3af","#d6c5a8"][i]}} />)}</div>
      <Link href={`/products/${id}`}><h3>{title}</h3></Link>
      <div className="price-row"><strong>{activePrice.toLocaleString("vi-VN")}đ</strong>{sale ? <del>{price.toLocaleString("vi-VN")}đ</del> : null}</div>
    </div>
  </article>;
}
