import twilio from 'twilio';
import { env } from '../config/env';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  await client.messages.create({
    from: `whatsapp:${env.TWILIO_WHATSAPP_NUMBER_MANA_SHOP}`,
    to: `whatsapp:${to}`,
    body,
  });
}
