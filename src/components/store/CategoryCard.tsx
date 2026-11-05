import Link from "next/link";
import { ArrowRight, Grid2X2 } from "lucide-react";
import type { ApiCategory } from "@/lib/api";

interface CategoryCardProps {
  category: ApiCategory;
  image?: string | null;
}

export default function CategoryCard({ category, image }: CategoryCardProps) {
  return (
    <Link
      href={`/shop?category=${encodeURIComponent(category.name)}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
    >
      <div className="aspect-4/3 overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            width={360}
            height={270}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-blue-50 text-blue-600">
            <Grid2X2 size={28} />
          </div>
        )}
      </div>
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-blue-700">
          {category.name}
        </h3>
        <ArrowRight size={15} className="shrink-0 text-slate-400 group-hover:text-blue-600" />
      </div>
    </Link>
  );
}
