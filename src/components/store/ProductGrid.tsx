import type { ApiProduct } from "@/lib/api";
import ProductCard from "@/components/store/ProductCard";
import ProductSkeleton from "@/components/store/ProductSkeleton";

interface ProductGridProps {
  products?: ApiProduct[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export default function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 8,
}: ProductGridProps) {
  const gridClasses =
    "grid grid-cols-1 min-[440px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6";

  if (isLoading) {
    return (
      <div className={gridClasses} aria-label="Loading products">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
