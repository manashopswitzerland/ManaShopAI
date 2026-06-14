/**
 * One-time setup: uploads Mana Kendra knowledge DOCX files to OpenAI,
 * creates a vector store, and creates an Assistant with file_search.
 *
 * Run: npx ts-node-dev --transpile-only src/scripts/setup-kendra-assistant.ts
 *
 * After running, copy the printed KENDRA_ASSISTANT_ID into your .env
 * and set KENDRA_OPENAI_API_KEY to the client's OpenAI API key.
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Client's OpenAI API key (Mana Kendra account)
const API_KEY = process.env.KENDRA_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

if (!API_KEY) {
  console.error('Set KENDRA_OPENAI_API_KEY or OPENAI_API_KEY before running this script.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: API_KEY });

const KNOWLEDGE_FILES = [
  'C:/Users/pc/Downloads/Dienstleistungen von Mana Kendra.docx',
  'C:/Users/pc/Downloads/Mana Kendra – Wissensdatenbank.docx',
  'C:/Users/pc/Downloads/Gesundheitsprogramme Mana Kendra.docx',
  'C:/Users/pc/Downloads/Häufige Fragen.docx',
  'C:/Users/pc/Downloads/Mana_Shop_FAQ_Wissensdatenbank_v1.docx',
  'C:/Users/pc/Downloads/Alle Mitarbeiter.docx',
];

const ASSISTANT_INSTRUCTIONS = `Du bist der offizielle KI-Gesundheitsberater von Mana Kendra (mana-kendra.ch).

Mana Kendra ist ein ganzheitliches Gesundheitszentrum in Ostermundigen (Bern), Schweiz. Es bietet Massagen, Körpertherapien, Yoga, Ayurveda, energetische Behandlungen, Coaching und mehr.

DEINE KERNAUFGABEN:
• Beantworte Fragen zu Dienstleistungen, Preisen, Therapeuten und Programmen von Mana Kendra
• Empfehle passende Behandlungen basierend auf den Bedürfnissen des Kunden
• Verweise auf Mana Shop (mana-shop.ch) für Produkte (Nahrungsergänzung, Naturkosmetik etc.)

SPRACHE: Antworte IMMER in der Sprache, die der Kunde verwendet (Deutsch oder Englisch).

BUCHUNG:
• Massage & Behandlungen: https://www.mana-kendra.ch/massage-behandlung
• Kostenlose Beratung: https://kostenlose-beratung-buchen.youcanbook.me/

WICHTIG – FORMAT:
• Maximal 3–4 Zeilen oder 3 Aufzählungspunkte. Niemals länger.
• Jeden Aufzählungspunkt auf einer eigenen Zeile.
• Kein Markdown (keine *Sternchen*, kein **fett**).
• Buchungslink nur einmal am Ende.
• Kein "Gerne helfe ich dir" oder ähnliche Einleitungen.
• Benutze die hochgeladenen Wissensdokumente, um präzise und aktuelle Informationen zu geben.

Ton: Warm, kompetent, direkt.`;

async function main() {
  console.log('Uploading knowledge files to OpenAI...\n');

  const fileIds: string[] = [];

  for (const filePath of KNOWLEDGE_FILES) {
    const normalized = path.normalize(filePath);
    if (!fs.existsSync(normalized)) {
      console.warn(`  ⚠  File not found, skipping: ${normalized}`);
      continue;
    }

    const fileName = path.basename(normalized);
    process.stdout.write(`  Uploading: ${fileName} ... `);

    const uploaded = await openai.files.create({
      file: fs.createReadStream(normalized),
      purpose: 'assistants',
    });

    fileIds.push(uploaded.id);
    console.log(`✓ (${uploaded.id})`);
  }

  if (fileIds.length === 0) {
    console.error('\n❌ No files uploaded. Check that the DOCX files are in C:/Users/pc/Downloads/');
    process.exit(1);
  }

  console.log(`\nCreating vector store with ${fileIds.length} file(s)...`);
  const vectorStore = await openai.vectorStores.create({
    name: 'Mana Kendra Wissensdatenbank',
    file_ids: fileIds,
  });

  // Wait for vector store processing
  let vs = vectorStore;
  while (vs.status === 'in_progress') {
    await new Promise((r) => setTimeout(r, 2000));
    vs = await openai.vectorStores.retrieve(vs.id);
    process.stdout.write('.');
  }
  console.log(`\nVector store ready: ${vs.id} (${vs.file_counts.completed} files indexed)`);

  console.log('\nCreating OpenAI Assistant...');
  const assistant = await openai.beta.assistants.create({
    name: 'Mana Kendra Gesundheitsberater',
    instructions: ASSISTANT_INSTRUCTIONS,
    model: 'gpt-4o',
    tools: [{ type: 'file_search' }],
    tool_resources: {
      file_search: { vector_store_ids: [vs.id] },
    },
  });

  console.log('\n✅ Done! Add these to your .env on Render:\n');
  console.log(`KENDRA_ASSISTANT_ID=${assistant.id}`);
  console.log(`KENDRA_OPENAI_API_KEY=${API_KEY}`);
  console.log('\nAssistant ID:', assistant.id);
  console.log('Vector Store ID:', vs.id);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err);
  process.exit(1);
});
