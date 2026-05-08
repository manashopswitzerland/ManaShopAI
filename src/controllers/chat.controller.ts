import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { brainService } from '../services/brain.service';
import { Conversation } from '../models/conversation.model';

export const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(128),
  storeId: z.enum(['mana-shop', 'mana-kendra']),
  language: z.enum(['de', 'en']).optional(),
  requestHuman: z.boolean().optional(),
});

export type ChatBody = z.infer<typeof chatSchema>;

export async function handleWebChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as ChatBody;

    const output = await brainService.process({
      userMessage: body.message,
      sessionId: body.sessionId,
      channel: 'web',
      storeId: body.storeId,
      language: body.language,
      requestHuman: body.requestHuman,
    });

    res.json({
      reply: output.reply,
      sessionId: body.sessionId,
      tokensUsed: output.tokensUsed,
      contextSources: output.contextSources,
      handoffTriggered: output.handoffTriggered ?? false,
      conversationStatus: output.conversationStatus ?? 'ai',
    });
  } catch (err) {
    next(err);
  }
}

// Polling endpoint for web widget to pick up human-agent replies
export async function pollMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId } = req.params;
    const since = req.query.since ? new Date(req.query.since as string) : new Date(0);

    const conversation = await Conversation.findOne({ sessionId, channel: 'web' }).lean();
    if (!conversation) {
      res.json({ messages: [], status: 'ai' });
      return;
    }

    const newMessages = conversation.messages.filter(
      (m) => new Date(m.timestamp) > since
    );

    res.json({
      messages: newMessages,
      status: conversation.status,
    });
  } catch (err) {
    next(err);
  }
}
