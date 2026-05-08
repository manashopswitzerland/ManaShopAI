import type { Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { Conversation } from '../models/conversation.model';
import { sendEmail } from '../services/email.service';
import { env } from '../config/env';

// ── List conversations ──────────────────────────────────────────────────────

export async function listConversations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { channel, status, showAll } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (channel) filter.channel = channel;

    if (status) {
      filter.status = status;
    } else if (!showAll) {
      // Default: only show conversations that need human attention
      filter.status = { $in: ['human_pending', 'human'] };
    }

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    // Return full messages for list (frontend handles preview truncation)
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
}

// ── Get single conversation ────────────────────────────────────────────────

export async function getConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation });
  } catch (err) {
    next(err);
  }
}

// ── Human takes over ───────────────────────────────────────────────────────

export async function handoffConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    conversation.status = 'human';
    await conversation.save();

    res.json({ success: true, status: conversation.status });
  } catch (err) {
    next(err);
  }
}

// ── Human sends reply ──────────────────────────────────────────────────────

export async function replyToConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { message } = req.body as { message?: string };
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    if (conversation.status !== 'human') {
      res.status(409).json({ error: 'Conversation must be in human mode to reply. Call /handoff first.' });
      return;
    }

    // Store reply in conversation
    conversation.messages.push({ role: 'assistant', content: message.trim(), timestamp: new Date() });
    await conversation.save();

    // Dispatch to the correct platform
    let dispatched = false;
    let dispatchError: string | undefined;

    try {
      if (conversation.channel === 'whatsapp') {
        await dispatchWhatsApp(conversation.storeId, conversation.customerContact, message.trim());
        dispatched = true;
      } else if (conversation.channel === 'email') {
        const customerEmail =
          conversation.customerContact || conversation.sessionId.replace(/^email:/, '');
        await sendEmail({
          to: customerEmail,
          subject: 'Re: Your Mana Support Request',
          text: message.trim(),
          isHumanReply: true,
        });
        dispatched = true;
      } else {
        // web/Shopify — stored in DB, widget polls via GET /chat/web/messages/:sessionId
        dispatched = true;
      }
    } catch (err) {
      dispatchError = err instanceof Error ? err.message : String(err);
      console.error(`[Dashboard] Failed to dispatch ${conversation.channel} reply:`, err);
    }

    res.json({
      success: true,
      dispatched,
      channel: conversation.channel,
      ...(dispatchError ? { dispatchError } : {}),
    });
  } catch (err) {
    next(err);
  }
}

// ── Resolve conversation ───────────────────────────────────────────────────

export async function resolveConversation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    conversation.status = 'resolved';
    await conversation.save();

    res.json({ success: true, status: 'resolved' });
  } catch (err) {
    next(err);
  }
}

// ── Platform dispatch helpers ──────────────────────────────────────────────

async function dispatchWhatsApp(storeId: string, customerPhone: string, message: string): Promise<void> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  if (!customerPhone) {
    throw new Error('No customer phone number on record for this conversation');
  }

  const fromNumber =
    storeId === 'mana-kendra'
      ? env.TWILIO_WHATSAPP_NUMBER_MANA_KENDRA
      : env.TWILIO_WHATSAPP_NUMBER_MANA_SHOP;

  if (!fromNumber) {
    throw new Error(`Twilio WhatsApp number not configured for store: ${storeId}`);
  }

  const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${customerPhone}`,
    body: message,
  });
}
