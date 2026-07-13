import Link from "next/link";

export default function Footer() {
  return <footer className="commerce-footer">
    <div className="footer-grid">
      <div><div className="brand-mark">MOUSEEE</div><p>Thương hiệu thời trang Việt Nam mang tinh thần tự do, sáng tạo và khác biệt.</p></div>
      <div><h3>Khám phá</h3><Link href="/shop">Sản phẩm</Link><Link href="/custom">Tùy chỉnh 3D</Link><Link href="/daily">Daily</Link></div>
      <div><h3>Hỗ trợ</h3><a href="#">Hướng dẫn chọn size</a><a href="#">Chính sách đổi trả</a><a href="#">Thanh toán & vận chuyển</a></div>
      <div><h3>Nhận bản tin MOUSEEE</h3><p>Cập nhật BST mới, ưu đãi và nhiều hơn nữa.</p><form className="newsletter"><input type="email" placeholder="Email của bạn" aria-label="Email nhận bản tin"/><button>Đăng ký</button></form></div>
    </div>
    <div className="footer-bottom"><span>© 2026 MOUSEEE. All rights reserved.</span><span>Điều khoản sử dụng · Chính sách bảo mật</span></div>
  </footer>;
}
