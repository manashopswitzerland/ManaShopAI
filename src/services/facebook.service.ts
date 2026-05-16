import { env } from '../config/env';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

// Instagram Business Account ID for mana.shop.bern
const INSTAGRAM_BUSINESS_ACCOUNT_ID = '17841474222261757';

export async function sendFacebookMessage(recipientId: string, text: string, channel: 'facebook' | 'instagram' = 'facebook'): Promise<void> {
  const token = channel === 'instagram'
    ? (env.INSTAGRAM_ACCESS_TOKEN || env.FACEBOOK_PAGE_ACCESS_TOKEN)
    : env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!token) {
    throw new Error('No access token configured for channel: ' + channel);
  }

  // Instagram DMs use the IG business account ID as the sender, not /me
  const senderId = channel === 'instagram' ? INSTAGRAM_BUSINESS_ACCOUNT_ID : 'me';

  const res = await fetch(`${GRAPH_API}/${senderId}/messages?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Facebook Graph API error ${res.status}: ${body}`);
  }
}
