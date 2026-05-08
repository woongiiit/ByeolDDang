import Image from "next/image";
import Link from "next/link";
import { BedDouble, MapPin, Ruler, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, formatKRWShort } from "@/lib/format";
import type { PropertyListItem } from "@/lib/types";

export function PropertyCard({ p }: { p: PropertyListItem }) {
  return (
    <Link
      href={`/properties/${p.id}`}
      className="card group block overflow-hidden transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg">
        {p.main_image_url ? (
          <Image
            src={p.main_image_url}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-text-muted">No image</div>
        )}
        {p.is_premium && (
          <Badge tone="premium" className="absolute left-3 top-3">
            프리미엄 감정
          </Badge>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-xs">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{p.rating_avg.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-lg font-semibold tabular-nums">{formatKRWShort(p.price)}</p>
            <p className="mt-1 line-clamp-1 text-xs text-text-muted">
              <MapPin size={12} className="-mt-0.5 mr-1 inline" />
              {p.address}
            </p>
          </div>
          <Badge>{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {p.rooms !== null && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={12} /> 침실 {p.rooms}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Ruler size={12} /> {p.area_m2}m²
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-text-muted">감정 {p.review_count}건 이용 가능</span>
          <span className="font-medium text-primary">상세보기 →</span>
        </div>
      </div>
    </Link>
  );
}
