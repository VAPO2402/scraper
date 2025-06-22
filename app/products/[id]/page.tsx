import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductCard from "@/components/ProductCard";
import ShareButton from "@/components/ShareButton";
import { getProductById, getSimilarProducts } from "@/lib/actions";
import { formatNumber } from "@/lib/utils";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: { id: string };
};

// Generate a deterministic random number based on product _id
const seededRandom = (seed: string, max: number, min: number) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  }
  return min + (hash % (max - min + 1));
};

const ProductDetails = async ({ params: { id } }: Props) => {
  const product: Product | null = await getProductById(id);

  if (!product) {
    console.log(`Product not found in MongoDB (websift.scrapped): ${id}`);
    redirect("/");
  }

  console.log('Product from MongoDB (websift.scrapped):', {
    _id: product._id,
    title: product.title,
    description: product.description,
    stars: product.stars,
    reviewsCount: product.reviewsCount,
  });

  const similarProducts = await getSimilarProducts(id);

  // Normalize product.description
  // This formats the product description from MongoDB (websift.scrapped collection).
  // - Source: product.description is fetched via getProductById from the websift.scrapped collection.
  // - Format: Can be a string (e.g., "line1\nline2"), array (e.g., ["line1", "line2"]), or null/undefined.
  // - Processing:
  //   - If an array, use as-is.
  //   - If a string, split on newlines (\n) and remove empty lines.
  //   - If null/undefined, use an empty array.
  // - To manually edit, set a custom array, e.g.:
  //   const descriptionLines = ["Custom line 1", "Custom line 2"];
  // - To edit in MongoDB:
  //   db.scrapped.updateOne({ _id: "your-product-id" }, { $set: { description: "Line 1\nLine 2" } });
  const descriptionLines = Array.isArray(product.description)
    ? product.description
    : typeof product.description === "string"
      ? product.description.split("\n").filter((line) => line.trim())
      : [];

  // Handle stars: use product.stars or seeded random 1.0-5.9
  const stars =
    typeof product.stars === "number" && product.stars >= 1 && product.stars <= 5
      ? product.stars
      : seededRandom(id, 59, 10) / 10; // 1.0 to 5.9

  // Handle reviews: use product.reviewsCount or seeded random 50-800
  const reviews =
    typeof product.reviewsCount === "number" && product.reviewsCount > 0
      ? product.reviewsCount
      : seededRandom(id + "reviews", 800, 50); // Unique seed for reviews

  // Handle likes: use product.reviewsCount or seeded random 50-800
  const likes =
    typeof product.reviewsCount === "number" && product.reviewsCount > 0
      ? product.reviewsCount
      : seededRandom(id + "likes", 800, 50); // Unique seed for likes

  // Generate seeded random recommendation percentage (50-100%)
  const recommendationPercent = seededRandom(id + "percent", 100, 50);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Main product section */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Product Image */}
        <div className="flex-shrink-0 w-full lg:w-1/2">
          <Image
            src={product.image}
            alt={product.title}
            width={500}
            height={400}
            className="w-full h-auto rounded-md object-contain"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl text-gray-800 font-semibold">{product.title}</h1>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-3xl text-gray-800 font-bold">
              {product.currency} {formatNumber(product.currentPrice)}
            </p>
            <p className="text-xl text-gray-500 line-through">
              {product.currency} {formatNumber(product.originalPrice)}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-1 p-2 bg-[#efefef] rounded-md hover:bg-red-500 transition">
                <Image src="/assets/icons/star.svg" alt="star" width={16} height={16} />
                <p className="text-sm font-medium">{stars.toFixed(1)}</p>
              </div>
              <div className="flex items-center gap-1 p-2 bg-[#efefef] rounded-md hover:bg-red-500 transition">
                <Image src="/assets/icons/comment.svg" alt="comment" width={16} height={16} />
                <p className="text-sm font-medium">{reviews} Reviews</p>
              </div>
              <div className="flex items-center gap-1 p-2 bg-[#efefef] rounded-md hover:bg-red-500 transition">
                <Image src="/assets/icons/red-heart.svg" alt="heart" width={16} height={16} />
                <p className="text-sm font-medium">{likes}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              <span className="text-green-600 font-medium">{recommendationPercent}% </span> of buyers have recommended this.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ShareButton productId={id} />
            <button className="p-2 bg-[#212121] rounded-md hover:bg-[#333] transition">
              <Image src="/assets/icons/bookmark.svg" alt="save" width={20} height={20} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <PriceInfoCard
              title="Current Price"
              iconSrc="/assets/icons/price-tag.svg"
              value={`${product.currency} ${formatNumber(product.currentPrice)}`}
            />
            <PriceInfoCard
              title="Average Price"
              iconSrc="/assets/icons/chart.svg"
              value={`${product.currency} ${formatNumber(product.averagePrice)}`}
            />
            <PriceInfoCard
              title="Highest Price"
              iconSrc="/assets/icons/arrow-up.svg"
              value={`${product.currency} ${formatNumber(product.highestPrice)}`}
            />
            <PriceInfoCard
              title="Lowest Price"
              iconSrc="/assets/icons/arrow-down.svg"
              value={`${product.currency} ${formatNumber(product.lowestPrice)}`}
            />
          </div>

          <Modal productId={id} />
        </div>
      </div>

      {/* Product Description */}
      <div className="flex flex-col gap-4 mt-8">
        <h3 className="text-xl text-gray-800 font-semibold">Product Description</h3>
        <div className="flex flex-col gap-2 text-gray-700">
          {descriptionLines.length > 0 ? (
            descriptionLines.map((line: string, index: number) => (
              <p key={index} className="text-base leading-relaxed">
                {line}
              </p>
            ))
          ) : (
            <p className="text-base text-gray-500 italic">No description available.</p>
          )}
        </div>
      </div>

      {/* Buy Now Button */}
      <button className="w-fit mx-auto flex items-center justify-center gap-2 min-w-[200px] mt-6 bg-[#212121] text-white py-3 px-6 rounded-lg hover:bg-[#333] transition">
        <Image src="/assets/icons/bag.svg" alt="buy" width={20} height={20} />
        <Link href={product.url} target="_blank" className="text-lg text-white font-bold">
          Buy Now
        </Link>
      </button>

      {/* Similar Products */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="py-10 flex flex-col gap-3 w-full">
          <p className="text-lg font-semibold text-gray-800">Similar Products</p>
          <div className="flex flex-wrap gap-5 sm:gap-6 mt-4 w-full">
            {similarProducts.map((product: Product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;