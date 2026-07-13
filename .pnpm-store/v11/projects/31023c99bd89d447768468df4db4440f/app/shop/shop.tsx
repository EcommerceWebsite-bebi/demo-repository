"use client";
import { useMemo, useState } from "react";
import { ChevronDown, Filter, RotateCcw } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProductCard from "../../components/ProductCard";
import { useApp } from "../../components/AppContext";

const styles=["Oversize","Basic","Polo","Custom"];
const sizes=["S","M","L","XL"];
const colors=["Black","White","Red","Blue"];
export default function ShopPage(){
 const {products}=useApp(); const [style,setStyle]=useState<string|null>(null); const [size,setSize]=useState<string|null>(null); const [color,setColor]=useState<string|null>(null); const [sort,setSort]=useState("newest"); const [filtersOpen,setFiltersOpen]=useState(false);
 const filtered=useMemo(()=>{const list=products.filter(p=>(!style||p.category_name===style)&&(!size||p.sizes.includes(size))&&(!color||p.colors.includes(color))); return [...list].sort((a,b)=>sort==="asc"?a.price-b.price:sort==="desc"?b.price-a.price:b.id-a.id)},[products,style,size,color,sort]);
 const clear=()=>{setStyle(null);setSize(null);setColor(null)};
 return <div className="commerce-page"><Header/><main className="shop-main">
  <div className="breadcrumbs">Trang chủ <span>/</span> Sản phẩm</div>
  <section className="shop-intro"><h1>Tất cả sản phẩm</h1><p>Tìm thiết kế hợp gu hoặc bắt đầu tạo phong cách của riêng bạn.</p></section>
  <div className="category-rail">{styles.map((x,i)=><button key={x} onClick={()=>setStyle(style===x?null:x)} className={style===x?"selected":""}><img src={["/images/mouseee/cosmic-black-tee.png","/images/mouseee/abstract-white-tee-back.png","/images/mouseee/hero-streetwear-v2.png","/images/mouseee/washed-charcoal-hoodie.png"][i]} alt=""/><span><strong>{x}</strong><small>{products.filter(p=>p.category_name===x).length} sản phẩm</small></span></button>)}</div>
  <button className="mobile-filter-toggle" onClick={()=>setFiltersOpen(!filtersOpen)}><Filter size={18}/> Bộ lọc</button>
  <div className="shop-layout">
   <aside className={`filter-sidebar ${filtersOpen?"open":""}`}>
    <FilterGroup title="Danh mục">{styles.map(x=><Check key={x} label={x} active={style===x} onClick={()=>setStyle(style===x?null:x)}/>)}</FilterGroup>
    <FilterGroup title="Khoảng giá"><div className="price-inputs"><input value="0" readOnly/><span>–</span><input value="700000" readOnly/></div><div className="range-line"/></FilterGroup>
    <FilterGroup title="Kích cỡ">{sizes.map(x=><Check key={x} label={x} active={size===x} onClick={()=>setSize(size===x?null:x)}/>)}</FilterGroup>
    <FilterGroup title="Màu sắc">{colors.map(x=><Check key={x} label={{Black:"Đen",White:"Trắng",Red:"Đỏ",Blue:"Xanh navy"}[x]!} active={color===x} onClick={()=>setColor(color===x?null:x)}/>)}</FilterGroup>
    <button className="clear-filter" onClick={clear}><RotateCcw size={16}/> Xóa bộ lọc</button>
   </aside>
   <section className="results-area"><div className="results-bar"><div><strong>{filtered.length} sản phẩm</strong><div className="active-filters">{[style,size,color].filter(Boolean).map(x=><button key={x!} onClick={()=>x===style?setStyle(null):x===size?setSize(null):setColor(null)}>{x} ×</button>)}</div></div><label className="sort-select"><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Mới nhất</option><option value="asc">Giá thấp đến cao</option><option value="desc">Giá cao đến thấp</option></select><ChevronDown size={16}/></label></div>
    {filtered.length?<div className="shop-grid">{filtered.map(p=><ProductCard key={p.id} id={p.id} title={p.name} price={p.price} discount_price={p.discount_price} img={p.image} altImg={p.images?.[1]} colors={p.colors} stock={p.stock}/>)}</div>:<div className="empty-products">Không tìm thấy sản phẩm phù hợp. Hãy thử xóa bớt bộ lọc.</div>}
   </section>
  </div>
 </main><Footer/></div>
}
function FilterGroup({title,children}:{title:string;children:React.ReactNode}){return <div className="filter-group"><h3>{title}<ChevronDown size={16}/></h3>{children}</div>}
function Check({label,active,onClick}:{label:string;active:boolean;onClick:()=>void}){return <button className="filter-check" onClick={onClick}><span className={active?"checked":""}>{active?"✓":""}</span>{label}</button>}
