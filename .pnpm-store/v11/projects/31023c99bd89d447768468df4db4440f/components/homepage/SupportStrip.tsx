import { CreditCard, Headphones, RotateCcw, Truck } from "lucide-react";
const ITEMS=[[Truck,"Miễn phí vận chuyển","Cho đơn hàng từ 499.000đ"],[RotateCcw,"Đổi trả 30 ngày","Dễ dàng và nhanh chóng"],[CreditCard,"Thanh toán an toàn","Đa dạng phương thức"],[Headphones,"Hỗ trợ tận tâm","8:00 - 22:00 mỗi ngày"]] as const;
export default function SupportStrip(){return <section className="support-strip">{ITEMS.map(([Icon,title,copy])=><div key={title}><Icon/><span><strong>{title}</strong><small>{copy}</small></span></div>)}</section>}
