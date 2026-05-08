import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { env } from '../config/env';
import { brainService } from './brain.service';
import { sendEmail } from './email.service';

function createImapClient(): Imap {
  return new Imap({
    user:        env.IMAP_USER,
    password:    env.IMAP_PASSWORD,
    host:        env.IMAP_HOST,
    port:        parseInt(env.IMAP_PORT, 10),
    tls:         true,
    tlsOptions:  { rejectUnauthorized: false },
    connTimeout: 15000,
    authTimeout: 10000,
  });
}

interface ParsedEmail {
  uid:     number;
  from:    string;
  subject: string;
  text:    string;
}

// Prevent concurrent poll runs
let isPolling = false;

function markSeen(imap: Imap, uids: number[]): Promise<void> {
  return new Promise((resolve) => {
    imap.setFlags(uids, ['\\Seen'], (err) => {
      if (err) console.warn('[IMAP] Could not mark as seen:', err.message);
      resolve();
    });
  });
}

function fetchUnseen(imap: Imap): Promise<ParsedEmail[]> {
  return new Promise((resolve, reject) => {
    imap.search(['UNSEEN'], (err, uids) => {
      if (err) return reject(err);
      if (!uids || uids.length === 0) return resolve([]);

      const emails: ParsedEmail[] = [];
      const pending: Promise<void>[] = [];
      const fetch = imap.fetch(uids, { bodies: '' });

      fetch.on('message', (msg, seqno) => {
        const uid = uids[seqno - 1] ?? uids[0];
        let raw = '';
        msg.on('body', (stream) => {
          stream.on('data', (chunk: Buffer) => { raw += chunk.toString('utf8'); });
        });
        const p = new Promise<void>((res) => {
          msg.once('end', async () => {
            try {
              const parsed  = await simpleParser(raw);
              const from    = parsed.from?.text ?? '';
              const subject = parsed.subject ?? '(no subject)';
              const text    = (parsed.text ?? '').trim();
              if (from && text) emails.push({ uid, from, subject, text });
            } catch { /* skip malformed */ }
            res();
          });
        });
        pending.push(p);
      });

      fetch.once('error', reject);
      fetch.once('end', () => Promise.all(pending).then(() => resolve(emails)));
    });
  });
}

async function processEmail(email: ParsedEmail): Promise<void> {
  console.log(`[IMAP] Processing email from: ${email.from} | ${email.subject}`);
  try {
    const senderEmail = email.from.toLowerCase().replace(/.*<([^>]+)>.*/, '$1').trim();
    const storeId = senderEmail.includes('kendra') ? 'mana-kendra' : 'mana-shop';
    const sessionId = `email:${senderEmail}`;

    const output = await brainService.process({
      userMessage:     `Subject: ${email.subject}\n\n${email.text}`,
      sessionId,
      channel:         'email',
      storeId,
      customerContact: senderEmail,
    });

    // Don't auto-reply when conversation is in human mode — the agent replies from dashboard
    if (output.conversationStatus === 'human' || output.conversationStatus === 'human_pending') {
      console.log(`[IMAP] Conversation in human mode — skipping auto-reply to ${email.from}`);
      return;
    }

    await sendEmail({
      to:      email.from,
      subject: `Re: ${email.subject}`,
      text:    output.reply,
    });

    console.log(`[IMAP] Reply sent to: ${email.from}`);
  } catch (err) {
    console.error(`[IMAP] Failed to reply to ${email.from}:`, err);
  }
}

export async function pollInbox(): Promise<void> {
  if (!env.IMAP_HOST || !env.IMAP_USER || !env.IMAP_PASSWORD) {
    console.warn('[IMAP] Credentials not configured — skipping poll');
    return;
  }

  // Skip if a poll is already running
  if (isPolling) {
    console.log('[IMAP] Poll already in progress — skipping');
    return;
  }

  isPolling = true;

  return new Promise((resolve) => {
    const imap = createImapClient();

    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err) => {
        if (err) {
          console.error('[IMAP] Cannot open inbox:', err.message);
          imap.end();
          isPolling = false;
          return resolve();
        }

        try {
          const emails = await fetchUnseen(imap);
          console.log(`[IMAP] ${emails.length} new email(s) found`);

          if (emails.length > 0) {
            // Mark ALL as seen FIRST — before processing — to prevent double-pick on any failure
            const uids = emails.map((e) => e.uid).filter(Boolean) as number[];
            if (uids.length > 0) await markSeen(imap, uids);

            // Process each email sequentially
            for (const email of emails) await processEmail(email);
          }
        } catch (pollErr) {
          console.error('[IMAP] Poll error:', pollErr);
        }

        imap.end();
      });
    });

    imap.once('end',   () => { isPolling = false; resolve(); });
    imap.once('error', (err: Error) => {
      console.error('[IMAP] Connection error:', err.message);
      isPolling = false;
      resolve();
    });

    imap.connect();
  });
}
