import type { Request, Response } from 'express';
import { env } from '../config/env';
import { brainService } from '../services/brain.service';
import { sendFacebookMessage } from '../services/facebook.service';
import type { Channel, StoreId } from '../types';

// GET /webhooks/facebook — Meta webhook verification handshake
export function verifyFacebookWebhook(req: Request, res: Response): void {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.FACEBOOK_VERIFY_TOKEN) {
    console.log('[Facebook] Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.warn('[Facebook] Webhook verification failed — token mismatch');
    res.sendStatus(403);
  }
}

interface MessagingEntry {
  sender:    { id: string };
  recipient: { id: string };
  message?:  { mid: string; text?: string };
  postback?: { payload: string; title: string };
}

interface InstagramChange {
  field: string;
  value: MessagingEntry;
}

interface WebhookBody {
  object: string;
  entry?: Array<{ messaging?: MessagingEntry[]; changes?: InstagramChange[] }>;
}

// POST /webhooks/facebook — incoming Messenger & Instagram DM messages
export async function handleFacebookWebhook(req: Request, res: Response): Promise<void> {
  // Acknowledge immediately so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body as WebhookBody;

  if (body.object !== 'page' && body.object !== 'instagram') return;

  for (const entry of body.entry ?? []) {
    // Messenger format: entry.messaging[]
    for (const event of entry.messaging ?? []) {
      await processEvent(event, body.object);
    }
    // Instagram format: entry.changes[].value
    for (const change of entry.changes ?? []) {
      if (change.field === 'messages' && change.value?.sender) {
        await processEvent(change.value, 'instagram');
      }
    }
  }
}

async function processEvent(event: MessagingEntry, object: string): Promise<void> {
  const senderId = event.sender.id;
  const text = event.message?.text ?? event.postback?.title;

  if (!text) return;

  const channel: Channel = object === 'instagram' ? 'instagram' : 'facebook';
  const storeId: StoreId = 'mana-shop'; // single page; extend with page-to-store mapping if needed

  try {
    const output = await brainService.process({
      userMessage: text,
      sessionId: `${channel}:${senderId}`,
      channel,
      storeId,
      customerContact: senderId,
    });

    await sendFacebookMessage(senderId, output.reply, channel);
  } catch (err) {
    console.error(`[Facebook] Error processing ${channel} message from ${senderId}:`, err);
    const fallback =
      'Es tut mir leid, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es später erneut oder schreib uns an info@mana-shop.ch';
    try { await sendFacebookMessage(senderId, fallback, channel); } catch { /* ignore send failure */ }
  }
}
