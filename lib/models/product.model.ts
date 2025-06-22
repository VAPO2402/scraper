import mongoose, { Schema } from 'mongoose';
import { Product } from '@/types';

const productSchema = new Schema<Product>({
  url: { type: String, required: true },
  currency: { type: String, required: true },
  image: { type: String, required: true },
  title: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  priceHistory: [{ price: Number, date: Date }],
  highestPrice: { type: Number, required: true },
  lowestPrice: { type: Number, required: true },
  averagePrice: { type: Number, required: true },
  discountRate: Number,
  description: Schema.Types.Mixed, // String or Array
  category: String,
  reviewsCount: Number,
  stars: Number,
  isOutOfStock: Boolean,
  users: [{ email: String }],
}, { 
  timestamps: true,
  collection: 'scrapped' // Specify the collection name
});

const ProductModel = mongoose.models.Product || mongoose.model<Product>('Product', productSchema);

export default ProductModel;