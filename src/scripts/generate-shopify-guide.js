const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 60, size: 'A4' });
const out = path.join(__dirname, '..', '..', 'Shopify-Setup-Guide.pdf');
doc.pipe(fs.createWriteStream(out));

// ── Colours ──────────────────────────────────────────────────
const GREEN      = '#2D4A3E';
const OCHRE      = '#C4853A';
const CREAM      = '#F5EFE6';
const LIGHT_GREY = '#F0F0F0';
const DARK_GREY  = '#444444';

// ── Header bar ───────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 100).fill(GREEN);
doc.fillColor('#FFFFFF')
   .font('Helvetica-Bold').fontSize(22)
   .text('Shopify Setup Guide', 60, 28);
doc.font('Helvetica').fontSize(11)
   .text('Mana AI Hub — API Token Setup', 60, 58);
doc.fillColor(OCHRE).fontSize(9)
   .text('mana-shop.ch  ·  mana-kendra.ch', 60, 76);

doc.moveDown(4);

// ── Intro ─────────────────────────────────────────────────────
doc.fillColor(DARK_GREY).font('Helvetica').fontSize(11)
   .text(
     'To connect the AI assistant to your Shopify stores, we need one API token per store. ' +
     'The process takes about 5 minutes per store. Please follow the steps below for ' +
     'Mana Shop first, then repeat for Mana Kendra.',
     { lineGap: 4 }
   );

doc.moveDown(1.2);

// ── Helper: step block ────────────────────────────────────────
function step(number, title, lines) {
  // Step number badge
  const y = doc.y;
  doc.rect(60, y, 28, 28).fill(OCHRE);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14)
     .text(String(number), 60, y + 6, { width: 28, align: 'center' });

  // Title
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(12)
     .text(title, 98, y + 7);

  doc.moveDown(0.2);

  // Body lines
  doc.fillColor(DARK_GREY).font('Helvetica').fontSize(10.5);
  for (const line of lines) {
    if (line.startsWith('CODE:')) {
      // Inline code box
      const code = line.slice(5);
      const codeY = doc.y;
      doc.rect(98, codeY, doc.page.width - 158, 20).fill(LIGHT_GREY);
      doc.fillColor('#8B3A2A').font('Courier').fontSize(10)
         .text(code, 106, codeY + 5);
      doc.font('Helvetica').fillColor(DARK_GREY);
      doc.moveDown(0.55);
    } else if (line.startsWith('CHECK:')) {
      doc.fillColor(GREEN).text('  ✓  ' + line.slice(6), 98, doc.y, { lineGap: 3 });
      doc.fillColor(DARK_GREY);
    } else if (line.startsWith('WARN:')) {
      doc.fillColor(OCHRE).font('Helvetica-Bold')
         .text('  ⚠  ' + line.slice(5), 98, doc.y, { lineGap: 3 });
      doc.fillColor(DARK_GREY).font('Helvetica');
    } else {
      doc.text('  ' + line, 98, doc.y, { lineGap: 3 });
    }
  }
  doc.moveDown(0.9);
}

// ── Divider ───────────────────────────────────────────────────
function divider(label) {
  doc.moveDown(0.4);
  doc.rect(60, doc.y, doc.page.width - 120, 26).fill(GREEN);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
     .text(label, 60, doc.y - 20, { width: doc.page.width - 120, align: 'center' });
  doc.moveDown(1.4);
}

// ══════════════════════════════════════════════════════════════
divider('DO THIS FOR MANA SHOP FIRST — THEN REPEAT FOR MANA KENDRA');

step(1, 'Open your Shopify Admin', [
  'Go to this website and log in:',
  'CODE:https://admin.shopify.com',
  'Select your store: Mana Shop',
]);

step(2, 'Go to Settings', [
  'Click Settings in the bottom-left corner of the screen.',
  'Then click: Apps and sales channels',
]);

step(3, 'Open Developer Tools', [
  'Click Develop apps (top-right of the page).',
  'If a warning appears, click Allow custom app development to continue.',
]);

step(4, 'Create the App', [
  'Click the Create an app button.',
  'When asked for a name, type exactly:',
  'CODE:Mana AI Hub',
  'Then click Create app.',
]);

step(5, 'Set Permissions', [
  'Click Configure Admin API scopes.',
  'Search for and check these two boxes:',
  'CHECK:read_products',
  'CHECK:read_orders',
  'Click Save.',
]);

step(6, 'Install and Copy the Token', [
  'Click Install app — then click Install again to confirm.',
  'You will now see Admin API access token.',
  'Click Reveal token once.',
  'WARN:Copy it immediately — Shopify only shows it ONCE!',
  'The token looks like this:',
  'CODE:shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  'Send this token to your developer.',
]);

step(7, 'Repeat for Mana Kendra', [
  'Go back to admin.shopify.com and switch to your Mana Kendra store.',
  'Repeat Steps 2 through 6 exactly.',
  'Send the second token to your developer as well.',
]);

// ── Summary box ───────────────────────────────────────────────
doc.moveDown(0.5);
const boxY = doc.y;
doc.rect(60, boxY, doc.page.width - 120, 70).fill(CREAM);
doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(11)
   .text('What to send your developer:', 75, boxY + 10);
doc.fillColor(DARK_GREY).font('Helvetica').fontSize(10.5)
   .text('1.  Token for Mana Shop      →   shpat_...', 75, boxY + 28)
   .text('2.  Token for Mana Kendra   →   shpat_...', 75, boxY + 44);

// ── Footer ────────────────────────────────────────────────────
doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(GREEN);
doc.fillColor('#FFFFFF').font('Helvetica').fontSize(9)
   .text(
     'Mana AI Hub  ·  Confidential  ·  Generated ' + new Date().toLocaleDateString('de-CH'),
     60, doc.page.height - 26
   );

doc.end();
console.log('PDF saved to:', out);
