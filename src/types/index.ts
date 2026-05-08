export type Channel = 'whatsapp' | 'web' | 'email';
export type StoreId = 'mana-shop' | 'mana-kendra';
export type Language = 'de' | 'en';
export type MessageRole = 'user' | 'assistant';
export type ConversationStatus = 'ai' | 'human_pending' | 'human' | 'resolved';

export interface AIMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface BrainInput {
  userMessage: string;
  sessionId: string;
  channel: Channel;
  storeId: StoreId;
  language?: Language;
  requestHuman?: boolean;
  customerContact?: string;
}

export interface BrainOutput {
  reply: string;
  tokensUsed: number;
  contextSources: string[];
  handoffTriggered?: boolean;
  conversationStatus?: string;
}

export interface IAIProvider {
  complete(params: AICompletionParams): Promise<AICompletionResult>;
}

export interface AICompletionParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  model: string;
}

export interface AICompletionResult {
  text: string;
  tokensUsed: number;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  tags: string;
  variants: Array<{ price: string }>;
  updated_at: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export interface SyncResult {
  storeId: StoreId;
  fetched: number;
  upserted: number;
  errors: number;
}
