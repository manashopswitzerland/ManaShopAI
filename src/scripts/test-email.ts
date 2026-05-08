import '../config/env';
import { env } from '../config/env';
import sgMail from '@sendgrid/mail';
import Imap from 'imap';

async function testOutbound() {
  console.log('\n--- Testing SendGrid outbound ---');
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  try {
    await sgMail.send({
      to: 'murtaza.special623@gmail.com',
      from: env.SENDGRID_FROM_EMAIL,
      subject: 'Mana AI Hub — Email Test',
      text: 'Outbound email works! The AI can now send replies via SendGrid.',
      html: '<p>✅ <strong>Outbound email works!</strong> The AI can now send replies via SendGrid.</p>',
    });
    console.log('✅ SendGrid outbound: OK — check murtaza.special623@gmail.com');
  } catch (err: unknown) {
    console.error('❌ SendGrid error:', (err as Error).message);
  }
}

async function testImap() {
  console.log('\n--- Testing IMAP connection ---');
  return new Promise<void>((resolve) => {
    const imap = new Imap({
      user:     env.IMAP_USER,
      password: env.IMAP_PASSWORD,
      host:     env.IMAP_HOST,
      port:     parseInt(env.IMAP_PORT, 10),
      tls:      true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { console.error('❌ IMAP open inbox error:', err.message); imap.end(); resolve(); return; }
        console.log(`✅ IMAP connected: ${box.messages.total} emails in inbox`);
        imap.end();
        resolve();
      });
    });

    imap.once('error', (err: Error) => {
      console.error('❌ IMAP connection error:', err.message);
      resolve();
    });

    imap.connect();
  });
}

(async () => {
  await testOutbound();
  await testImap();
  console.log('\nDone.');
  process.exit(0);
})();
