const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const outputPath = path.join(__dirname, '../../public', 'Facebook-Instagram-Setup-Guide.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// ─── Colors & Fonts ───────────────────────────────────────────────────────────
const BLUE       = '#1877F2'; // Facebook blue
const PURPLE     = '#833AB4'; // Instagram purple
const DARK       = '#1A1A2E';
const GRAY       = '#555566';
const LIGHT_GRAY = '#F4F4F8';
const WHITE      = '#FFFFFF';
const GREEN      = '#27AE60';
const ORANGE     = '#E67E22';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pageWidth() { return doc.page.width - 100; }

function coverRect(color) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(color);
}

function sectionHeader(title, color = BLUE) {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.rect(50, y, pageWidth(), 32).fill(color);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
     .text(title, 62, y + 9, { width: pageWidth() - 24 });
  doc.fillColor(DARK).font('Helvetica').fontSize(10);
  doc.moveDown(0.2);
  doc.y = y + 40;
}

function subHeader(title, color = DARK) {
  doc.moveDown(0.6);
  doc.fillColor(color).font('Helvetica-Bold').fontSize(11).text(title);
  doc.fillColor(DARK).font('Helvetica').fontSize(10);
  doc.moveDown(0.2);
}

function body(text, indent = 0) {
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text(text, 50 + indent, doc.y, { width: pageWidth() - indent });
  doc.moveDown(0.3);
}

function bullet(text, indent = 16) {
  const y = doc.y;
  doc.fillColor(BLUE).font('Helvetica').fontSize(10)
     .text('•', 50 + indent, y, { width: 14 });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text(text, 50 + indent + 14, y, { width: pageWidth() - indent - 14 });
  doc.moveDown(0.25);
}

function numberedStep(n, title, desc) {
  doc.moveDown(0.5);
  // circle badge
  const cx = 68, cy = doc.y + 9;
  doc.circle(cx, cy, 10).fill(BLUE);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9)
     .text(String(n), cx - 4, cy - 5, { width: 14, align: 'center' });
  // title
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10.5)
     .text(title, 84, cy - 5, { width: pageWidth() - 34 });
  doc.y = cy + 10;
  if (desc) body(desc, 34);
}

function infoBox(text, color = LIGHT_GRAY, textColor = GRAY) {
  doc.moveDown(0.4);
  const boxY = doc.y;
  const lines = doc.heightOfString(text, { width: pageWidth() - 24, font: 'Helvetica', fontSize: 10 });
  const boxH = lines + 20;
  doc.rect(50, boxY, pageWidth(), boxH).fill(color);
  doc.fillColor(textColor).font('Helvetica').fontSize(10)
     .text(text, 62, boxY + 10, { width: pageWidth() - 24 });
  doc.y = boxY + boxH + 6;
  doc.fillColor(DARK);
}

function warningBox(text) { infoBox('⚠  ' + text, '#FEF3CD', '#856404'); }
function tipBox(text)     { infoBox('💡 ' + text, '#D4EDDA', '#155724'); }

function envVar(key, value) {
  const y = doc.y;
  doc.rect(50, y, pageWidth(), 20).fill('#F0F0F5');
  doc.fillColor('#C0392B').font('Courier').fontSize(9)
     .text(key + '=', 58, y + 5, { continued: true, width: 200 });
  doc.fillColor('#2980B9').font('Courier').fontSize(9).text(value);
  doc.y = y + 22;
  doc.fillColor(DARK).font('Helvetica').fontSize(10);
}

function divider() {
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(50 + pageWidth(), doc.y).stroke('#DDDDEE');
  doc.moveDown(0.5);
}

function newPage() { doc.addPage(); }

// ─────────────────────────────────────────────────────────────────────────────
// COVER PAGE
// ─────────────────────────────────────────────────────────────────────────────
coverRect(DARK);

// gradient-ish accent bar
doc.rect(0, 0, 8, doc.page.height).fill(BLUE);
doc.rect(8, 0, 4, doc.page.height).fill(PURPLE);

// logo area
doc.rect(50, 60, 70, 70).fill('#FFFFFF11');
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(28).text('f', 74, 83);
doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(16).text('IG', 96, 90);

// title
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(28)
   .text('Facebook & Instagram', 50, 155, { width: pageWidth() });
doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(22)
   .text('Messaging Bot Setup Guide', 50, 190, { width: pageWidth() });

doc.fillColor('#AAAACC').font('Helvetica').fontSize(12)
   .text('Step-by-step integration with the Mana AI Hub', 50, 230, { width: pageWidth() });

// divider line
doc.moveTo(50, 260).lineTo(50 + pageWidth(), 260).lineWidth(1).stroke('#FFFFFF33');

// info cards row
const cardY = 280;
const cardW = (pageWidth() - 20) / 3;

[[BLUE, 'Platform', 'Meta (Facebook)'],
 [PURPLE, 'Channels', 'Messenger + Instagram DM'],
 [GREEN, 'Effort', '~2–4 hours + review']].forEach(([col, label, val], i) => {
  const cx = 50 + i * (cardW + 10);
  doc.rect(cx, cardY, cardW, 60).fill('#FFFFFF15');
  doc.fillColor(col).font('Helvetica-Bold').fontSize(9).text(label.toUpperCase(), cx + 10, cardY + 10, { width: cardW - 20 });
  doc.fillColor(WHITE).font('Helvetica').fontSize(10).text(val, cx + 10, cardY + 26, { width: cardW - 20 });
});

// what's inside
doc.fillColor('#AAAACC').font('Helvetica-Bold').fontSize(10)
   .text('WHAT\'S INSIDE', 50, 370);
const contents = [
  'What to request from the client',
  'Creating a Meta Developer App',
  'Configuring Messenger & Instagram APIs',
  'Webhook setup & verification',
  'Generating Page Access Tokens',
  'Environment variables reference',
  'App Review submission checklist',
  'Testing before going live',
];
contents.forEach((c, i) => {
  doc.fillColor(WHITE).font('Helvetica').fontSize(10)
     .text(`${i + 1}.  ${c}`, 50, 390 + i * 20, { width: pageWidth() });
});

// footer
doc.fillColor('#555577').font('Helvetica').fontSize(9)
   .text('Mana AI Hub  •  Confidential Client Document  •  ' + new Date().toLocaleDateString('en-GB', { year:'numeric',month:'long',day:'numeric' }),
        50, doc.page.height - 40, { width: pageWidth(), align: 'center' });

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — What to Collect from the Client
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('1.  What to Collect from the Client', BLUE);

body('Before any technical work begins, gather the following from the client. This is everything needed to connect their Facebook Page and Instagram account to the bot.');

subHeader('Facebook Page', BLUE);
bullet('Client must have an existing Facebook Page (not a personal profile).');
bullet('You need Admin access to the Page — ask the client to go to:\n   Facebook Page → Settings → Page Roles → Add you as Admin.');
bullet('Note down the Facebook Page ID:\n   Page Settings → About → scroll to bottom → Page ID.');

subHeader('Instagram Account', PURPLE);
bullet('Instagram account must be a Business or Creator account (not Personal).');
bullet('It must be connected to the Facebook Page:\n   Instagram app → Settings → Account → Linked Accounts → Facebook.');
bullet('If not yet converted: Instagram → Settings → Account → Switch to Professional Account.');

subHeader('Meta Business Suite', '#E67E22');
bullet('The client should have a Meta Business Suite (business.facebook.com) account.');
bullet('Ask them to add you as a Partner:\n   Business Settings → Partners → Add → enter your Business ID or email.');
bullet('Alternative: they can give you temporary admin access to their Facebook account\n   to set up the app and revoke it afterward.');

warningBox('If the client does not have a Meta Business account, help them create one first at business.facebook.com — it is free and required for production API access.');

subHeader('Checklist Summary');
const checklist = [
  ['Facebook Page', 'Admin access granted to your account'],
  ['Facebook Page ID', 'Noted from Page Settings → About'],
  ['Instagram account', 'Business/Creator type'],
  ['Instagram → Facebook', 'Linked in Instagram settings'],
  ['Meta Business Suite', 'Partner access granted'],
];
checklist.forEach(([item, detail]) => {
  const y = doc.y;
  doc.rect(50, y, 14, 14).stroke(BLUE);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(item, 72, y + 1, { continued: true });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text('  —  ' + detail);
  doc.moveDown(0.3);
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — Create the Meta Developer App
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('2.  Create a Meta Developer App', BLUE);

body('This app is the bridge between the bot server and the client\'s Facebook/Instagram accounts. It lives in the Meta Developer Portal.');

numberedStep(1, 'Go to the Meta Developer Portal',
  'Visit developers.facebook.com and log in with the client\'s Facebook account (or your own if you have partner access).');

numberedStep(2, 'Create a New App',
  'Click "My Apps" → "Create App". Choose "Business" as the app type. Give it a name like "Mana AI Hub" and link it to the client\'s Meta Business account.');

numberedStep(3, 'Add the Messenger Product',
  'On the App Dashboard, click "Add Product" → find "Messenger" → click "Set Up".');

numberedStep(4, 'Add the Instagram Product',
  'Still on the App Dashboard → "Add Product" → find "Instagram" (Instagram Graph API) → click "Set Up".');

numberedStep(5, 'Note the App Credentials',
  'Go to App Settings → Basic. Copy the App ID and App Secret — you\'ll need these as environment variables.');

tipBox('Keep the App Secret confidential — treat it like a password. Never commit it to git.');

divider();

sectionHeader('3.  Configure Messenger API', BLUE);

numberedStep(1, 'Connect the Facebook Page',
  'In Messenger settings → "Access Tokens" → click "Add or Remove Pages" → select the client\'s Facebook Page → grant all requested permissions.');

numberedStep(2, 'Generate a Page Access Token',
  'After connecting, click "Generate Token" next to the Page name. Copy this — it\'s the FACEBOOK_PAGE_ACCESS_TOKEN.');

numberedStep(3, 'Make the Token Permanent',
  'The generated token is short-lived by default. To make it never-expiring:\n  1. Exchange it for a long-lived token using the Graph API Explorer\n  2. Or use the "Generate Token" button with the correct permissions (pages_messaging, pages_read_engagement) — this produces a permanent token automatically when the app is Live.');

warningBox('In Development mode, the bot can only send messages to users who are listed as App Testers or Admins. You must go Live (Section 7) to reach real customers.');

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — Instagram + Webhooks
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('4.  Configure Instagram Messaging API', PURPLE);

numberedStep(1, 'Link Instagram in the Instagram Product Settings',
  'In the Instagram product settings → "Set Up Instagram" → "Add Account" → select the client\'s Instagram Business account.');

numberedStep(2, 'Grant Permissions',
  'Make sure the following permissions are enabled:\n  • instagram_basic\n  • instagram_manage_messages\n  • pages_manage_metadata');

numberedStep(3, 'Access Token',
  'Instagram DMs use the same Page Access Token as Messenger. No separate token is needed, but the token must have instagram_manage_messages scope.');

tipBox('To verify the token has Instagram scope, go to Graph API Explorer → paste the token → check "Permissions" tab for instagram_manage_messages.');

divider();

sectionHeader('5.  Webhook Setup', '#27AE60');

body('Webhooks are how Meta sends incoming messages to your server in real time. The server must be publicly accessible (e.g. deployed on Render).');

numberedStep(1, 'Choose a Verify Token',
  'This is any random string you create — e.g. "mana-fb-webhook-2025". Store it as FACEBOOK_VERIFY_TOKEN in your .env file.');

numberedStep(2, 'Configure Webhook in Messenger Settings',
  'Messenger product → "Webhooks" → "Add Callback URL"\n  Callback URL:  https://your-server.com/webhook/facebook\n  Verify Token:  (the string you chose above)\n  Subscribe to:  messages, messaging_postbacks, messaging_read');

numberedStep(3, 'Subscribe the Page',
  'After saving, click "Add Subscriptions" next to the connected Page and check:\n  messages, messaging_postbacks');

numberedStep(4, 'Configure Webhook for Instagram',
  'Instagram product → "Webhooks" → same callback URL → subscribe to:\n  messages, messaging_postbacks');

numberedStep(5, 'Verify the Webhook',
  'Meta will send a GET request to your webhook URL with hub.verify_token and hub.challenge. The server must respond with hub.challenge to confirm. Once done, Meta shows a green checkmark.');

infoBox('Webhook endpoint the server will expose:\n  GET  /webhook/facebook   →  verification handshake\n  POST /webhook/facebook   →  incoming messages (Messenger + Instagram)', '#EEF2FF', DARK);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — Env Variables
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('6.  Environment Variables Reference', '#C0392B');

body('Add the following variables to your .env file on the server. Never commit these to git.');

doc.moveDown(0.5);
const vars = [
  ['FACEBOOK_APP_ID',            '123456789012345          # From App Settings → Basic'],
  ['FACEBOOK_APP_SECRET',        'abc123...                # From App Settings → Basic'],
  ['FACEBOOK_VERIFY_TOKEN',      'mana-fb-webhook-2025     # You choose this value'],
  ['FACEBOOK_PAGE_ACCESS_TOKEN', 'EAAxxxxxx...             # From Messenger → Access Tokens'],
];
vars.forEach(([k, v]) => envVar(k, v));

doc.moveDown(0.5);
body('If the client has separate Facebook Pages for Mana Shop and Mana Kendra, use distinct variable names:');
doc.moveDown(0.3);
const multiVars = [
  ['FACEBOOK_PAGE_ACCESS_TOKEN_MANA_SHOP',   'EAAxxxxxx...'],
  ['FACEBOOK_PAGE_ACCESS_TOKEN_MANA_KENDRA', 'EAAxxxxxx...'],
];
multiVars.forEach(([k, v]) => envVar(k, v));

tipBox('Instagram DMs share the same Page Access Token as Messenger — no extra variable needed.');

divider();

sectionHeader('7.  App Review — Going Live', ORANGE);

body('In Development mode only you (admins/testers) can interact with the bot. To serve real customers, you must submit for App Review.');

subHeader('Permissions to Request');
const perms = [
  ['pages_messaging', 'Required to send and receive messages via Messenger'],
  ['instagram_manage_messages', 'Required to send and receive Instagram DMs'],
  ['pages_read_engagement', 'Required to read page content for context'],
  ['pages_manage_metadata', 'Required to subscribe to webhook events'],
];
perms.forEach(([perm, desc]) => {
  doc.fillColor('#C0392B').font('Courier').fontSize(9).text(perm, 66, doc.y, { continued: true, width: 200 });
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text('  —  ' + desc, { width: pageWidth() - 60 });
  doc.moveDown(0.25);
});

subHeader('Submission Steps');
numberedStep(1, 'Switch App to Live mode', 'App Dashboard → top toggle → switch from "Development" to "Live". A warning will appear if required permissions aren\'t approved yet — that\'s normal at this stage.');
numberedStep(2, 'Go to App Review → Permissions', 'Click "Add to Submission" next to each permission listed above. Provide a short description of how the bot uses each one.');
numberedStep(3, 'Record a Screen Video', 'Meta requires a video showing the bot in action. Record a short demo of a user sending a message and the bot replying. Upload to the submission.');
numberedStep(4, 'Submit', 'Click Submit for Review. Review typically takes 1–5 business days. Meta may request additional information.');

warningBox('Do NOT use fake or placeholder data in the review submission. Use the real bot responding to real test messages — Meta reviewers test it themselves.');

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6 — Testing Checklist + Troubleshooting
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('8.  Testing Before Going Live', GREEN);

body('Run through these tests while still in Development mode. Add yourself and the client as App Testers in App Roles.');

subHeader('Webhook Verification Test');
bullet('Check server logs — when you saved the webhook URL, the server should have logged a GET request with hub.verify_token.');
bullet('Meta Dashboard should show a green checkmark next to the webhook URL.');

subHeader('Messenger Test');
bullet('From a personal Facebook account added as an App Tester, send a message to the client\'s Facebook Page.');
bullet('Verify the message appears in server logs (POST /webhook/facebook).');
bullet('Verify the bot replies within 5 seconds.');

subHeader('Instagram DM Test');
bullet('From an Instagram account added as a tester, send a DM to the client\'s Instagram Business account.');
bullet('Verify the reply comes back from the Instagram account.');

subHeader('Human Handoff Test');
bullet('Send a message that triggers handoff (e.g. "I want to speak to a human").');
bullet('Verify it appears in the Mana AI Hub dashboard marked for human review.');

divider();

sectionHeader('9.  Common Issues & Fixes', '#8E44AD');

const issues = [
  ['Webhook returns 403', 'The FACEBOOK_VERIFY_TOKEN in .env doesn\'t match what you entered in Meta Dashboard. Double-check for extra spaces.'],
  ['Bot not replying in Messenger', 'The Page Access Token may be expired or missing pages_messaging scope. Regenerate the token.'],
  ['Instagram DMs not received', 'The Instagram account isn\'t linked to the Facebook Page, or instagram_manage_messages permission is missing.'],
  ['Messages only go to admins', 'App is still in Development mode. Switch to Live mode and complete App Review.'],
  ['Token expires after 1 hour', 'You used a short-lived token. Exchange it for a long-lived token via Graph API Explorer (60-day) or generate during Live mode (permanent).'],
  ['"Unsupported get request" error', 'The webhook URL path doesn\'t match what the server exposes. Confirm the route is /webhook/facebook.'],
];

issues.forEach(([issue, fix]) => {
  const y = doc.y;
  doc.rect(50, y, pageWidth(), 1).fill('#EEEEEE');
  doc.moveDown(0.3);
  doc.fillColor('#C0392B').font('Helvetica-Bold').fontSize(10).text(issue, 50, doc.y);
  doc.fillColor(GRAY).font('Helvetica').fontSize(10).text(fix, 50, doc.y, { width: pageWidth() });
  doc.moveDown(0.5);
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7 — Quick Reference Card
// ─────────────────────────────────────────────────────────────────────────────
newPage();

sectionHeader('Quick Reference Card', DARK);

const refItems = [
  ['Meta Developer Portal', 'developers.facebook.com'],
  ['Meta Business Suite', 'business.facebook.com'],
  ['Graph API Explorer', 'developers.facebook.com/tools/explorer'],
  ['App Review Status', 'developers.facebook.com → App Review → Requests'],
  ['Webhook Callback URL', 'https://your-server.com/webhook/facebook'],
  ['Token Debugger', 'developers.facebook.com/tools/debug/accesstoken'],
];

refItems.forEach(([label, url]) => {
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10).text(label + ':  ', 50, doc.y, { continued: true });
  doc.fillColor(BLUE).font('Helvetica').fontSize(10).text(url);
  doc.moveDown(0.35);
});

divider();

subHeader('Required Permissions Summary');
const permTable = [
  ['Permission', 'Messenger', 'Instagram'],
  ['pages_messaging', '✓', '—'],
  ['instagram_manage_messages', '—', '✓'],
  ['pages_read_engagement', '✓', '✓'],
  ['pages_manage_metadata', '✓', '✓'],
];
const colW = [pageWidth() * 0.5, pageWidth() * 0.25, pageWidth() * 0.25];
permTable.forEach((row, i) => {
  const y = doc.y;
  const bg = i === 0 ? BLUE : (i % 2 === 0 ? '#F8F8FC' : WHITE);
  doc.rect(50, y, pageWidth(), 20).fill(bg);
  row.forEach((cell, j) => {
    const x = 50 + colW.slice(0, j).reduce((a, b) => a + b, 0);
    const textColor = i === 0 ? WHITE : (cell === '✓' ? GREEN : GRAY);
    const font = i === 0 ? 'Helvetica-Bold' : 'Helvetica';
    doc.fillColor(textColor).font(font).fontSize(9)
       .text(cell, x + 6, y + 5, { width: colW[j] - 6 });
  });
  doc.y = y + 22;
});

doc.moveDown(1);
tipBox('Bookmark the Token Debugger — it shows the exact expiry, scopes, and which Page the token belongs to. Use it any time a token seems to stop working.');

// footer on last page
doc.fillColor('#AAAAAA').font('Helvetica').fontSize(8)
   .text('Mana AI Hub  •  Facebook & Instagram Setup Guide  •  Generated ' + new Date().toLocaleDateString('en-GB', { year:'numeric',month:'long',day:'numeric' }),
        50, doc.page.height - 40, { width: pageWidth(), align: 'center' });

// ─── Finalize ─────────────────────────────────────────────────────────────────
doc.end();
console.log('PDF generated at:', outputPath);
