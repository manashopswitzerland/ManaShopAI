import { config } from 'dotenv';
import { z } from 'zod';

config();

// Required in all environments — server cannot function without these.
const requiredSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  MONGODB_URI: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  ADMIN_API_KEY: z.string().default('dev-admin-key'),
});

// Optional — channels that are not yet configured are simply disabled at runtime.
const optionalSchema = z.object({
  APP_URL: z.string().default('http://localhost:4000'),
  SHOPIFY_APP_CLIENT_ID: z.string().default(''),
  SHOPIFY_APP_CLIENT_SECRET: z.string().default(''),
  SHOPIFY_MANA_SHOP_DOMAIN: z.string().default('mana-shop.myshopify.com'),
  SHOPIFY_MANA_SHOP_TOKEN: z.string().default(''),
  SHOPIFY_MANA_KENDRA_DOMAIN: z.string().default('mana-kendra.myshopify.com'),
  SHOPIFY_MANA_KENDRA_TOKEN: z.string().default(''),

  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_WHATSAPP_NUMBER_MANA_SHOP: z.string().default(''),
  TWILIO_WHATSAPP_NUMBER_MANA_KENDRA: z.string().default(''),

  SENDGRID_API_KEY: z.string().default(''),
  SENDGRID_FROM_EMAIL: z.string().default('noreply@mana-shop.ch'),

  IMAP_HOST: z.string().default(''),
  IMAP_PORT: z.string().default('993'),
  IMAP_USER: z.string().default(''),
  IMAP_PASSWORD: z.string().default(''),

  // Firebase Cloud Messaging (push notifications for Android APK)
  FCM_SERVICE_ACCOUNT_JSON: z.string().default(''),

  // Facebook / Instagram Messenger
  FACEBOOK_APP_ID: z.string().default(''),
  FACEBOOK_APP_SECRET: z.string().default(''),
  FACEBOOK_VERIFY_TOKEN: z.string().default(''),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().default(''),
  FACEBOOK_PAGE_ID: z.string().default(''),
  INSTAGRAM_PAGE_ACCESS_TOKEN: z.string().default(''),
  INSTAGRAM_APP_ID: z.string().default(''),
  INSTAGRAM_APP_SECRET: z.string().default(''),
  INSTAGRAM_ACCESS_TOKEN: z.string().default(''),

  // Mana Kendra custom knowledge assistant (OpenAI Assistants API)
  KENDRA_OPENAI_API_KEY: z.string().default(''),
  KENDRA_ASSISTANT_ID: z.string().default(''),
});

const envSchema = requiredSchema.merge(optionalSchema);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Environment validation failed (required vars missing):');
  console.error(parsed.error.flatten().fieldErrors);
  console.error('\n👉  Copy .env.example → .env and fill in MONGODB_URI and OPENAI_API_KEY to start.\n');
  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;

// Warn about unconfigured optional channels (don't block startup)
if (parsed.data.NODE_ENV !== 'test') {
  const warnings: string[] = [];
  if (!parsed.data.SHOPIFY_MANA_SHOP_TOKEN) warnings.push('SHOPIFY (mana-shop)');
  if (!parsed.data.SHOPIFY_MANA_KENDRA_TOKEN) warnings.push('SHOPIFY (mana-kendra)');
  if (!parsed.data.TWILIO_ACCOUNT_SID)        warnings.push('TWILIO / WhatsApp');
  if (!parsed.data.SENDGRID_API_KEY)           warnings.push('SENDGRID / Email');
  if (!parsed.data.IMAP_HOST)                  warnings.push('IMAP');
  if (!parsed.data.FACEBOOK_PAGE_ACCESS_TOKEN) warnings.push('FACEBOOK / Instagram');
  if (warnings.length) {
    console.warn(`⚠  Unconfigured channels (disabled): ${warnings.join(', ')}`);
  }
}

