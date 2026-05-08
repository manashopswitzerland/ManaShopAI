import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { brainService } from '../services/brain.service';
import type { StoreId } from '../types';

// Map Twilio numbers to storeIds
const twilioNumberToStore: Record<string, StoreId> = {
  [env.TWILIO_WHATSAPP_NUMBER_MANA_SHOP]: 'mana-shop',
  [env.TWILIO_WHATSAPP_NUMBER_MANA_KENDRA]: 'mana-kendra',
};

export async function handleWhatsApp(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const from = req.body.From as string | undefined;
    const to = req.body.To as string | undefined;
    const body = req.body.Body as string | undefined;

    if (!from || !body) {
      res.status(400).send('<Response></Response>');
      return;
    }

    // Strip "whatsapp:" prefix Twilio adds
    const toNumber = to?.replace('whatsapp:', '') ?? '';
    const fromNumber = from.replace('whatsapp:', '');

    const storeId: StoreId = twilioNumberToStore[toNumber] ?? 'mana-shop';

    const output = await brainService.process({
      userMessage: body,
      sessionId: `wa:${fromNumber}`,
      channel: 'whatsapp',
      storeId,
      customerContact: fromNumber,
    });

    // Respond with Twilio TwiML
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(output.reply)}</Message>
</Response>`);
  } catch (err) {
    console.error('[WhatsApp] Error processing message:', err);
    res.set('Content-Type', 'text/xml');
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Es tut mir leid, ich konnte deine Anfrage nicht verarbeiten. Bitte versuche es später erneut oder kontaktiere uns unter info@mana-shop.ch</Message>
</Response>`);
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
