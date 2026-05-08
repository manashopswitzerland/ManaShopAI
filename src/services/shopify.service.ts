import { env } from '../config/env';
import { Product } from '../models/product.model';
import type { StoreId, ShopifyProduct, SyncResult } from '../types';

// --- Store configuration map ---

interface StoreConfig {
  domain: string;
  token: string;
}

const storeConfigs: Record<StoreId, StoreConfig> = {
  'mana-shop': {
    domain: env.SHOPIFY_MANA_SHOP_DOMAIN,
    token: env.SHOPIFY_MANA_SHOP_TOKEN,
  },
  'mana-kendra': {
    domain: env.SHOPIFY_MANA_KENDRA_DOMAIN,
    token: env.SHOPIFY_MANA_KENDRA_TOKEN,
  },
};

// --- HTML stripper ---

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// --- Shopify API paginator ---

async function fetchAllProducts(storeId: StoreId): Promise<ShopifyProduct[]> {
  const config = storeConfigs[storeId];
  const baseUrl = `https://${config.domain}/admin/api/2024-01/products.json`;
  const allProducts: ShopifyProduct[] = [];

  let url: string | null = `${baseUrl}?limit=250`;
  let pageCount = 0;

  while (url !== null) {
    pageCount++;
    console.log(`[Shopify:${storeId}] Fetching page ${pageCount}: ${url}`);

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': config.token,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Shopify API error for ${storeId}: ${response.status} ${response.statusText} — ${body}`
      );
    }

    const data = (await response.json()) as { products: ShopifyProduct[] };
    allProducts.push(...data.products);

    // Parse Link header for cursor-based pagination
    const linkHeader = response.headers.get('link');
    url = parseLinkHeaderNext(linkHeader);
  }

  console.log(`[Shopify:${storeId}] Fetched ${allProducts.length} products total`);
  return allProducts;
}

function parseLinkHeaderNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null;

  const parts = linkHeader.split(',');
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

// --- Store sync ---

async function syncStore(storeId: StoreId): Promise<SyncResult> {
  const result: SyncResult = { storeId, fetched: 0, upserted: 0, errors: 0 };

  console.log(`[Sync:${storeId}] Starting sync...`);
  const startTime = Date.now();

  try {
    const products = await fetchAllProducts(storeId);
    result.fetched = products.length;

    for (const product of products) {
      try {
        const price = product.variants[0]?.price ?? '0.00';
        const plain = stripHtml(product.body_html ?? '');
        const tags = product.tags
          ? product.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [];

        await Product.updateOne(
          { shopifyProductId: product.id },
          {
            $set: {
              storeId,
              shopifyProductId: product.id,
              title: product.title,
              descriptionHtml: product.body_html ?? '',
              plainDescription: plain,
              price,
              currency: 'CHF',
              tags,
              vendor: product.vendor ?? '',
              updatedAt: new Date(product.updated_at),
            },
          },
          { upsert: true }
        );

        result.upserted++;
      } catch (err) {
        result.errors++;
        console.error(`[Sync:${storeId}] Error upserting product ${product.id}:`, err);
      }
    }
  } catch (err) {
    console.error(`[Sync:${storeId}] Fatal sync error:`, err);
    result.errors++;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[Sync:${storeId}] Done in ${elapsed}s — fetched: ${result.fetched}, upserted: ${result.upserted}, errors: ${result.errors}`
  );

  return result;
}

// --- Sync all stores ---

async function syncAllStores(): Promise<SyncResult[]> {
  console.log('[Sync] Starting full sync for all stores...');
  const results = await Promise.all([syncStore('mana-shop'), syncStore('mana-kendra')]);
  console.log('[Sync] All stores sync complete:', results);
  return results;
}

export const shopifyService = {
  fetchAllProducts,
  stripHtml,
  syncStore,
  syncAllStores,
};
