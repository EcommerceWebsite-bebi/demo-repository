"use client";

export default function Hero() {
  return (
    <section className="relative min-h-[70vh] md:min-h-[85vh] w-full flex items-center overflow-hidden border-b border-gray-200">
      <div className="absolute inset-0 z-0">
        <img
          alt="banner-img"
          className="w-full h-full object-cover brightness-100"
          src="/images/pexels-ana-hidalgo-burgos-4848204-25311126.jpg"
        />
      </div>
      <div className="relative z-10 px-margin-x max-w-4xl text-white">
        <h1 className="text-[56px] md:text-[80px] leading-tight font-serif mb-6">NEW ARRIVALS</h1>
        <p className="text-lg max-w-xl mb-12 opacity-90">Stand out. Speak loud. Wear the future.
        Every piece speaks before you do.
        </p>
      </div>
    </section>
  );
}
