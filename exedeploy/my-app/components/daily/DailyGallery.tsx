interface GalleryItem {
  name: string;
}

interface DailyGalleryProps {
  items: GalleryItem[];
  title: string;
  subtitle: string;
}

export default function DailyGallery({ items, title, subtitle }: DailyGalleryProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      <div className="mt-6 grid auto-rows-[160px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-md border border-gray-200 bg-gray-100">
            <div className="absolute bottom-3 left-3 text-xs font-semibold uppercase text-gray-500">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
