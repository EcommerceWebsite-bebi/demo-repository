"use client";

export default function Footer() {
  return (
    <footer className="bg-white flex flex-col w-full px-margin-x py-stack-md border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div>
          <div className="text-xl font-bold mb-4">MOUSEEE</div>
          <p className="text-sm text-gray-600 max-w-xs">Nền tảng thời trang công nghệ tiên phong tại Việt Nam. Kết hợp haute couture với trí tuệ nhân tạo.</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase mb-6">Sản phẩm</h4>
          <ul className="space-y-4 text-sm text-gray-600">
            <li><a href="#" className="hover:text-black">Trang chủ</a></li>
            <li><a href="#" className="hover:text-black">Thử áo AI</a></li>
            <li><a href="#" className="hover:text-black">QR Cá nhân hóa</a></li>
            <li><a href="https://www.facebook.com/profile.php?id=61590546749223" target="_blank" rel="noopener noreferrer" className="hover:text-black">Về chúng tôi</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase mb-6">Liên hệ</h4>
          <ul className="space-y-4 text-sm text-gray-600">
            <li>Email: conchuotnhat@gmail.com</li>
            <li>Team: Spider Man and Girl</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase mb-6">Newsletter</h4>
          <form className="relative">
            <input className="w-full bg-transparent border-b border-gray-200 px-0 py-3 text-sm focus:ring-0" placeholder="Email của bạn" type="email" />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-semibold" type="submit">GỬI</button>
          </form>
        </div>
      </div>
      <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-xs text-gray-500">© 2026 team dev con chuot nhat. All rights reserved.</div>
        <div className="flex gap-8">
          <a className="opacity-80 hover:opacity-100" href="#"><span className="material-symbols-outlined">social_leaderboard</span></a>
          <a className="opacity-80 hover:opacity-100" href="#"><span className="material-symbols-outlined">retweet</span></a>
          <a className="opacity-80 hover:opacity-100" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
        </div>
      </div>
    </footer>
  );
}
