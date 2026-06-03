"use client";

export default function SupportStrip() {
  return (
    <div className="w-full px-margin-x py-stack-md border-y border-gray-200 flex flex-col md:flex-row items-start gap-6 md:gap-12 bg-white">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-3xl">phone_in_talk</span>
        <span className="text-2xl font-semibold">Hỗ trợ / Mua hàng :</span>
        <span className="text-2xl font-semibold text-red-400">0932198848</span>
      </div>
    </div>
  );
}
