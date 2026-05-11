import type { Request, Response, NextFunction } from 'express';
import { brainService } from '../services/brain.service';
import { Conversation } from '../models/conversation.model';
import { broadcastNotification } from '../services/notifications';

export async function handleInboundEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const from = req.body.from as string | undefined;
    const text = req.body.text as string | undefined;

    if (!from || !text) {
      res.status(200).send('OK');
      return;
    }

    const senderEmail = from.toLowerCase().trim();
    const sessionId   = `email:${senderEmail}`;

    // 1. AI reads the email and generates a reply (stored in conversation)
    const output = await brainService.process({
      userMessage:     text,
      sessionId,
      channel:         'email',
      storeId:         'mana-shop',
      customerContact: senderEmail,
    });

    // 2. Store AI draft + mark as pending for human review — no auto-send
    const conv = await Conversation.findOneAndUpdate(
      { sessionId, channel: 'email' },
      { status: 'human_pending', draftReply: output.reply },
      { new: true }
    );

    // Notify the client that a draft is waiting for approval
    const subject = `email from ${senderEmail}`;
    broadcastNotification(
      'AI Draft Ready — Review & Send',
      `Re: ${subject} — Tap to review the AI response before sending`,
      {
        screen:         'conversation',
        conversationId: String(conv?._id ?? ''),
        channel:        'email',
      }
    ).catch(() => {});

    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
}
