import { env } from '../config/env';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

export async function sendFacebookMessage(recipientId: string, text: string): Promise<void> {
  if (!env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN not configured');
  }

  const res = await fetch(`${GRAPH_API}/me/messages?access_token=${env.FACEBOOK_PAGE_ACCESS_TOKEN}`, {
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
