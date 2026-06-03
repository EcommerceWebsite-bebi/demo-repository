"use client";

export default function Ticker() {
  const items = [
    { icon: 'verified', text: 'Secure AI Processing' },
    { icon: 'public', text: 'Global Craftsmanship' },
    { icon: 'bolt', text: 'Real-time Visualization' },
    { icon: 'qr_code', text: 'Personalized QR Identity' },
  ];

  return (
    <div className="w-full py-6 border-b border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center space-x-12">
        <div className="animate-marquee whitespace-nowrap">
          {items.concat(items).map((it, i) => (
            <span key={i} className="inline-flex items-center gap-3 text-xs text-gray-600 uppercase mr-8">
              <span className="material-symbols-outlined text-[16px]">{it.icon}</span>
              {it.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
