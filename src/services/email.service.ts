import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

sgMail.setApiKey(env.SENDGRID_API_KEY);

function getLogoBase64(): string {
  try {
    const logoPath = path.join(__dirname, '..', '..', 'public', 'unnamed.jpg');
    return fs.readFileSync(logoPath).toString('base64');
  } catch {
    return '';
  }
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  isHumanReply?: boolean; // skip AI notice if a human agent is writing
}

// ── Signature ─────────────────────────────────────────────────────

const SIGNATURE_PLAIN = `

---
Liebe Grüsse

Das Mana Shop Team

Mana Kendra GmbH
Blankweg 2b
3072 Ostermundigen

www.mana-kendra.ch
www.mana-shop.ch
078 200 90 49

IBAN: CH95 8080 8005 1190 2294 7
Kontoinhaber: Mana Kendra GmbH`;

const AI_NOTICE_PLAIN = `

---
Diese Nachricht wurde automatisch von unserem KI-Assistenten erstellt.
Wenn Sie lieber mit einer echten Person sprechen möchten, antworten Sie einfach mit dem Wort: HUMAN
---`;

function buildSignatureHtml(isHumanReply: boolean): string {
  const aiNotice = isHumanReply ? '' : `
    <div style="margin-bottom:20px;padding:12px 16px;background:#f0f7ff;border-left:3px solid #2563eb;border-radius:4px;font-size:12px;color:#374151;">
      Diese Nachricht wurde automatisch von unserem KI-Assistenten erstellt.
      Wenn Sie lieber mit einer echten Person sprechen möchten, antworten Sie einfach mit dem Wort: <strong>HUMAN</strong>
    </div>`;

  return `
    ${aiNotice}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-family:Arial,sans-serif;font-size:13px;color:#374151;line-height:1.7;">
      <p style="margin:0 0 4px;">Liebe Grüsse</p>
      <p style="margin:0 0 16px;font-weight:bold;">Das Mana Shop Team</p>

      <p style="margin:0 0 16px;">
        Mana Kendra GmbH<br>
        Blankweg 2b<br>
        3072 Ostermundigen
      </p>

      <p style="margin:0 0 16px;">
        <a href="https://www.mana-kendra.ch" style="color:#16a34a;text-decoration:none;">www.mana-kendra.ch</a><br>
        <a href="https://www.mana-shop.ch"   style="color:#16a34a;text-decoration:none;">www.mana-shop.ch</a><br>
        078 200 90 49
      </p>

      <p style="margin:0;color:#6b7280;font-size:12px;">
        IBAN: CH95 8080 8005 1190 2294 7<br>
        Kontoinhaber: Mana Kendra GmbH
      </p>

      ${getLogoBase64() ? `<div style="margin-top:20px;"><img src="data:image/jpeg;base64,${getLogoBase64()}" alt="Mana Shop" width="180" style="display:block;" /></div>` : ''}
    </div>`;
}

// ── Send ──────────────────────────────────────────────────────────

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const isHuman = params.isHumanReply ?? false;

  const fullText = params.text
    + (isHuman ? '' : AI_NOTICE_PLAIN)
    + SIGNATURE_PLAIN;

  const bodyHtml = params.html ?? params.text.replace(/\n/g, '<br>');
  const fullHtml = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111827;line-height:1.6;max-width:600px;">
      <div style="margin-bottom:24px;">${bodyHtml}</div>
      ${buildSignatureHtml(isHuman)}
    </div>`;

  await sgMail.send({
    to: params.to,
    from: env.SENDGRID_FROM_EMAIL,
    subject: params.subject,
    text: fullText,
    html: fullHtml,
  });
}

export function parseInboundEmail(_payload: Record<string, unknown>): {
  from: string;
  subject: string;
  text: string;
} {
  throw new Error('parseInboundEmail not yet implemented');
}
