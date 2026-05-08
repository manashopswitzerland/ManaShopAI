import type { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

const SCOPES = 'read_products,read_orders';

export function startAuth(req: Request, res: Response): void {
  const shop = (req.query.shop as string) || '';
  if (!shop) {
    res.status(400).send('Missing shop parameter. Use: /auth/shopify?shop=mana-shop.myshopify.com');
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${env.APP_URL}/auth/shopify/callback`;

  const authUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${env.SHOPIFY_APP_CLIENT_ID}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`;

  res.redirect(authUrl);
}

export async function handleCallback(req: Request, res: Response): Promise<void> {
  const { shop, code } = req.query as Record<string, string>;

  if (!shop || !code) {
    res.status(400).send('Missing shop or code.');
    return;
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     env.SHOPIFY_APP_CLIENT_ID,
        client_secret: env.SHOPIFY_APP_CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenRes.json() as { access_token?: string; error?: string };

    if (!data.access_token) {
      res.status(400).send(`Shopify error: ${data.error ?? 'no token returned'}`);
      return;
    }

    const token = data.access_token;
    const storeId = shop.replace('.myshopify.com', '');

    // Determine which env var to set based on store
    const envKey = storeId === 'mana-shop'
      ? 'SHOPIFY_MANA_SHOP_TOKEN'
      : 'SHOPIFY_MANA_KENDRA_TOKEN';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shopify Token — ${storeId}</title>
        <style>
          body { font-family: sans-serif; max-width: 700px; margin: 60px auto; padding: 20px; }
          h1   { color: #2D4A3E; }
          .box { background: #F5EFE6; border: 2px solid #C4853A; border-radius: 8px;
                 padding: 20px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; }
          .label { color: #8B3A2A; font-weight: bold; margin-bottom: 8px; }
          button { background: #C4853A; color: white; border: none; padding: 10px 20px;
                   border-radius: 6px; cursor: pointer; font-size: 14px; }
          button:hover { background: #2D4A3E; }
        </style>
      </head>
      <body>
        <h1>✅ Token received for ${storeId}</h1>
        <p>Copy this line and paste it into your <code>.env</code> file:</p>
        <div class="box">
          <div class="label">${envKey}=</div>
          ${token}
        </div>
        <button onclick="navigator.clipboard.writeText('${envKey}=${token}').then(()=>this.textContent='Copied!')">
          Copy to clipboard
        </button>
        <hr style="margin:30px 0">
        <p style="color:#666">After saving the token in .env, restart the server and trigger the first Shopify sync:</p>
        <div class="box">POST /admin/sync-shopify<br>Header: x-admin-key: dev-admin-key</div>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Error exchanging token: ${String(err)}`);
  }
}
