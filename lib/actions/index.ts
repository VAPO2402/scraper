"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { User } from "@/types";
import { generateEmailBody, sendEmail } from "../nodemailer";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) {
    console.error('No product URL provided');
    throw new Error('Product URL is required');
  }

  try {
    await connectToDB();

    console.log(`Scraping product: ${productUrl}`);
    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) {
      console.error(`No product data scraped for URL: ${productUrl}`);
      throw new Error('Failed to scrape product data');
    }

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice }
      ];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    console.log(`Product saved/updated: ${newProduct._id}`);
    revalidatePath(`/products/${newProduct._id}`);
    return newProduct;
  } catch (error: any) {
    console.error(`Failed to create/update product for URL ${productUrl}:`, error.message);
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    await connectToDB();

    const product = await Product.findOne({ _id: productId });

    if (!product) {
      console.log(`Product not found: ${productId}`);
      return null;
    }

    return product;
  } catch (error: any) {
    console.error(`Error fetching product ${productId}:`, error.message);
    throw new Error(`Failed to fetch product: ${error.message}`);
  }
}

export async function getAllProducts() {
  try {
    await connectToDB();

    const products = await Product.find();
    console.log(`Fetched ${products.length} products`);
    return products;
  } catch (error: any) {
    console.error('Error fetching all products:', error.message);
    throw new Error(`Failed to fetch products: ${error.message}`);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    await connectToDB();

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      console.log(`Current product not found: ${productId}`);
      return null;
    }

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    console.log(`Fetched ${similarProducts.length} similar products for ${productId}`);
    return similarProducts;
  } catch (error: any) {
    console.error(`Error fetching similar products for ${productId}:`, error.message);
    throw new Error(`Failed to fetch similar products: ${error.message}`);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      console.error(`Invalid email format: ${userEmail}`);
      throw new Error('Invalid email format');
    }

    await connectToDB();

    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product not found: ${productId}`);
      throw new Error(`Product not found: ${productId}`);
    }

    const userExists = product.users.some((user: User) => user.email === userEmail);

    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();
      console.log(`Email ${userEmail} added to product ${productId} in websift.scrapped`);

      const emailContent = await generateEmailBody(product, "WELCOME");
      await sendEmail(emailContent, [userEmail]);
      console.log(`Email sent to ${userEmail} for product ${productId}`);
    } else {
      console.log(`Email ${userEmail} already exists for product ${productId}`);
      return { message: 'Email already tracking this product' };
    }

    return { message: 'Email added and notification sent successfully' };
  } catch (error: any) {
    console.error(`Error in addUserEmailToProduct for ${userEmail}:`, error.message);
    throw new Error(`Failed to add email or send notification: ${error.message}`);
  }
}