import type { Request, Response, NextFunction } from 'express';
import { brainService } from '../services/brain.service';
import { sendEmail } from '../services/email.service';

export async function handleInboundEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // SendGrid Inbound Parse sends multipart/form-data
    const from = req.body.from as string | undefined;
    const subject = req.body.subject as string | undefined;
    const text = req.body.text as string | undefined;

    if (!from || !text) {
      res.status(200).send('OK'); // always 200 to SendGrid to prevent retries
      return;
    }

    // Derive session from sender email
    const senderEmail = from.toLowerCase().trim();
    const sessionId = `email:${senderEmail}`;

    const output = await brainService.process({
      userMessage: text,
      sessionId,
      channel: 'email',
      storeId: 'mana-shop', // default; can be enhanced via recipient address mapping
      customerContact: senderEmail,
    });

    // Send reply via SendGrid
    await sendEmail({
      to: from,
      subject: `Re: ${subject ?? 'Ihre Anfrage'}`,
      text: output.reply,
    });

    res.status(200).send('OK');
  } catch (err) {
    next(err);
  }
}
