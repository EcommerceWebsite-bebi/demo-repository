"use client";

export default function FeatureSection() {
  return (
    <section className="bg-gray-50 py-stack-xl px-margin-x flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-white flex items-center justify-center border border-gray-200 mb-8 rounded-full">
        <span className="material-symbols-outlined text-primary">shield</span>
      </div>
      <h2 className="text-3xl font-semibold mb-6">Bảo mật &amp; Quyền riêng tư</h2>
      <p className="text-lg text-gray-600 max-w-2xl mb-12">Chúng tôi cam kết bảo vệ dữ liệu của bạn với mã hóa cao cấp. Tất cả hình ảnh được xóa ngay sau khi xử lý. Privacy-first AI chính là tôn chỉ của chúng tôi.</p>
      <div className="flex flex-wrap justify-center gap-12 border-t border-gray-200 pt-10">
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
          DỮ LIỆU ĐƯỢC MÃ HÓA
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
          HÌNH ẢNH TỰ ĐỘNG XÓA
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
          PRIVACY-FIRST AI
        </div>
      </div>
    </section>
  );
}
