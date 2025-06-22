"use server"

import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { extractCurrency, extractDescription, extractPrice } from '../utils';

// Helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function scrapeAmazonProduct(url: string) {
  if (!url) return null;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false,
  }

  try {
    console.log(`Scraping Amazon URL: ${url}`);
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $('#productTitle').text().trim();
    if (!title) {
      console.error('Amazon: No title found');
      return null;
    }

    // Expanded price selectors
    const currentPrice = extractPrice(
      $('.priceToPay span.a-price-whole'),
      $('.aok-offscreen'),
      $('.apexPriceToPay .a-offscreen'),
      $('.a.size.base.a-color-price'),
      $('.a-button-selected .a-color-base'),
      $('#corePrice_feature_div .a-price-whole')
    );

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price'),
      $('#corePriceDisplay_desktop_feature_div .a-text-strike')
    );

    const outOfStock = $('#availability span').text().trim().toLowerCase().includes('currently unavailable');

    const images = 
      $('#imgBlkFront').attr('data-a-dynamic-image') || 
      $('#landingImage').attr('data-a-dynamic-image') ||
      '{}'

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($('.a-price-symbol'));
    const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "") || '0';

    const description = extractDescription($);

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || '₹',
      image: imageUrls[0] || '',
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice) || 0,
      originalPrice: Number(originalPrice) || Number(currentPrice) || 0,
      priceHistory: [],
      discountRate: Number(discountRate),
      category: 'category',
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice) || 0,
      highestPrice: Number(originalPrice) || Number(currentPrice) || 0,
      averagePrice: Number(currentPrice) || Number(originalPrice) || 0,
    };

    console.log(`Amazon scraped: ${title}, Price: ${data.currentPrice}`);
    return data;
  } catch (error: any) {
    console.error(`Error scraping Amazon product ${url}:`, error.message);
    return null;
  }
}

export async function scrapeFlipkartProduct(url: string) {
  if (!url) return null;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  let browser;
  try {
    console.log(`Scraping Flipkart URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://brd.superproxy.io:${port}`,
        `--no-sandbox`,
        `--disable-setuid-sandbox`,
        `--disable-dev-shm-usage`,
        `--disable-gpu`,
      ],
    });
    const page = await browser.newPage();
    await page.authenticate({
      username: `${username}-session-${session_id}`,
      password,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Retry navigation up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Flipkart navigation attempt ${attempt}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.C7fE3F, .B_NuCI, .Nx9bqj, .s1Q9rs', { timeout: 30000 });
        break;
      } catch (navError) {
        console.warn(`Flipkart navigation attempt ${attempt} failed: ${navError}`);
        if (attempt === 3) throw new Error(`Navigation failed after 3 attempts: ${navError}`);
        await delay(4000);
      }
    }

    // Wait for dynamic content
    await delay(8000);

    const product = await page.evaluate(() => {
      const title = document.querySelector('.C7fE3F, .B_NuCI, .Nx9bqj, .s1Q9rs')?.textContent?.trim() || '';
      const currentPriceText = document.querySelector('._16Jk6d, ._30jeq3, ._1_WHN1, .Nx9bqj')?.textContent?.replace(/[^0-9.]/g, '') || '0';
      const currentPrice = Number(currentPriceText);
      const originalPriceText = document.querySelector('._3I9_wc, ._3qQ9m1, ._1V_ZGU')?.textContent?.replace(/[^0-9.]/g, '') || currentPriceText;
      const originalPrice = Number(originalPriceText);
      const image = document.querySelector('._2r_T1I, ._396cs4, .CXW8mj img, .K4WLMj img')?.getAttribute('src') || '';
      const description = Array.from(
        document.querySelectorAll('.X3BRps .row, ._1xgFaf .row, ._2o-xpa ._2vZ0mK, ._1AtVbE')
      ).map((el) => el.textContent?.trim()).filter(Boolean);
      const currency = document.querySelector('._16Jk6d, ._30jeq3, ._1_WHN1')?.textContent?.match(/[₹$]/)?.[0] || '₹';
      const outOfStock = !!document.querySelector('._16FRp0, ._1lRcqv, .aMaAEs');
      const discountRateText = document.querySelector('._3Ay6Sb span, ._1V_ZGU span')?.textContent?.replace(/[^0-9]/g, '') || '0';
      const discountRate = Number(discountRateText);

      return {
        url: window.location.href,
        currency,
        image,
        title,
        currentPrice,
        originalPrice,
        priceHistory: [],
        discountRate,
        category: 'category',
        reviewsCount: 100,
        stars: 4.5,
        isOutOfStock: outOfStock,
        description: description.length ? description : ['No description available'],
        lowestPrice: currentPrice || originalPrice || 0,
        highestPrice: originalPrice || currentPrice || 0,
        averagePrice: currentPrice || originalPrice || 0,
      };
    });

    if (!product.title) {
      console.error('Flipkart: No title found');
      await page.screenshot({ path: 'flipkart_error.png' });
      await browser.close();
      return null;
    }

    console.log(`Flipkart scraped: ${product.title}, Price: ${product.currentPrice}`);
    await browser.close();
    return product;
  } catch (error: any) {
    console.error(`Fatal error scraping Flipkart product ${url}:`, error.message);
    if (browser) await browser.close();
    return null;
  }
}

export async function scrapeSnapdealProduct(url: string) {
  if (!url) return null;

  // BrightData proxy configuration
  const username = String(process.env.BRIGHT_DATA_USERNAME);
  const password = String(process.env.BRIGHT_DATA_PASSWORD);
  const port = 33335;
  const session_id = (1000000 * Math.random()) | 0;

  let browser;
  try {
    console.log(`Scraping Snapdeal URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://brd.superproxy.io:${port}`,
        `--no-sandbox`,
        `--disable-setuid-sandbox`,
        `--disable-dev-shm-usage`,
        `--disable-gpu`,
      ],
    });
    const page = await browser.newPage();
    await page.authenticate({
      username: `${username}-session-${session_id}`,
      password,
    });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

    // Retry navigation up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Snapdeal navigation attempt ${attempt}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        await page.waitForSelector('.pdp-e-i-head, .pdp-product-name, .pdp-title, .product-title', { timeout: 30000 });
        break;
      } catch (navError) {
        console.warn(`Snapdeal navigation attempt ${attempt} failed: ${navError}`);
        if (attempt === 3) throw new Error(`Navigation failed after 3 attempts: ${navError}`);
        await delay(4000);
      }
    }

    // Wait for dynamic content
    await delay(8000);

    const product = await page.evaluate(() => {
      const title = document.querySelector('.pdp-e-i-head, .pdp-product-name, .pdp-title, .product-title')?.textContent?.trim() || '';
      const currentPriceText = document.querySelector('.payBlkBig, .pdp-final-price, .product-price')?.textContent?.replace(/[^0-9.]/g, '') || '0';
      const currentPrice = Number(currentPriceText);
      const originalPriceText = document.querySelector('.pdpCutPrice, .strike, .pdp-mrp, .pdp-original-price')?.textContent?.replace(/[^0-9.]/g, '') || currentPriceText;
      const originalPrice = Number(originalPriceText);
      const image = document.querySelector('.cloudzoom, .pdp-main-img, .product-image img')?.getAttribute('src') || '';
      const description = Array.from(
        document.querySelectorAll('.detailssubbox .p-key-features li, .pdp-desc, .product-desc .desc-text')
      ).map((el) => el.textContent?.trim()).filter(Boolean);
      const currency = document.querySelector('.payBlkBig, .pdp-final-price, .product-price')?.textContent?.match(/[₹$]/)?.[0] || '₹';
      const outOfStock = !!document.querySelector('.soldOut, .out-of-stock, .not-available');
      const discountRateText = document.querySelector('.pdp-discount, .discount-value, .pdp-offer')?.textContent?.replace(/[^0-9]/g, '') || '0';
      const discountRate = Number(discountRateText);

      return {
        url: window.location.href,
        currency,
        image,
        title,
        currentPrice,
        originalPrice,
        priceHistory: [],
        discountRate,
        category: 'category',
        reviewsCount: 100,
        stars: 4.5,
        isOutOfStock: outOfStock,
        description: description.length ? description : ['No description available'],
        lowestPrice: currentPrice || originalPrice || 0,
        highestPrice: originalPrice || currentPrice || 0,
        averagePrice: currentPrice || originalPrice || 0,
      };
    });

    if (!product.title) {
      console.error('Snapdeal: No title found');
      await page.screenshot({ path: 'snapdeal_error.png' });
      await browser.close();
      return null;
    }

    console.log(`Snapdeal scraped: ${product.title}, Price: ${product.currentPrice}`);
    await browser.close();
    return product;
  } catch (error: any) {
    console.error(`Fatal error scraping Snapdeal product ${url}:`, error.message);
    if (browser) await browser.close();
    return null;
  }
}