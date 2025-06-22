import { getSavedProducts } from "@/lib/actions";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import Image from "next/image";

const SavedProductsPage = async () => {
  // Hardcoded user email (replace with auth later)
  const userEmail = "user@example.com";
  const savedProducts: Product[] = await getSavedProducts(userEmail);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl text-gray-800 font-semibold mb-6">Saved Products</h1>
      {savedProducts.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/assets/icons/empty-heart.svg"
            alt="empty"
            width={100}
            height={100}
            className="object-contain"
          />
          <p className="text-gray-600 text-lg">No saved products yet.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5 sm:gap-6">
          {savedProducts.map((product: Product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProductsPage;