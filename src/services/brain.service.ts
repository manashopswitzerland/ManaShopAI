import OpenAI from 'openai';
import { env } from '../config/env';
import { Product } from '../models/product.model';
import { Faq } from '../models/faq.model';
import { Conversation } from '../models/conversation.model';
import { BusinessContext } from '../models/business-context.model';
import { Lead } from '../models/lead.model';
import { broadcastNotification } from './notifications';
import type {
  BrainInput,
  BrainOutput,
  IAIProvider,
  AICompletionParams,
  AICompletionResult,
} from '../types';

// --- AI Provider abstraction (swap to Gemini by implementing this interface) ---

class OpenAIProvider implements IAIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async complete(params: AICompletionParams): Promise<AICompletionResult> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('OpenAI returned an empty response');
    }

    return {
      text: choice.message.content,
      tokensUsed: response.usage?.total_tokens ?? 0,
    };
  }
}

// --- Context retrieval ---

interface ContextDoc {
  source: string;
  text: string;
}

async function retrieveContext(query: string, storeId: string): Promise<ContextDoc[]> {
  const results: ContextDoc[] = [];

  // Primary store products
  try {
    const products = await Product.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $text: { $search: query }, storeId } as any,
      { score: { $meta: 'textScore' }, title: 1, plainDescription: 1, price: 1, vendor: 1 }
    )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: 'textScore' } } as any)
      .limit(3)
      .lean();

    for (const p of products) {
      results.push({
        source: `product:${String(p._id)}`,
        text: `Produkt: ${p.title} | Preis: ${p.price} CHF | Hersteller: ${p.vendor}\n${p.plainDescription}`,
      });
    }
  } catch {
    // Text index may not exist yet; skip product context gracefully
  }

  // Cross-store products: only pull from mana-shop when serving mana-kendra.
  // mana-kendra sells services (massages, yoga, therapies), not products —
  // so never recommend mana-kendra products as cross-store suggestions.
  if (storeId === 'mana-kendra') {
    try {
      const crossProducts = await Product.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { $text: { $search: query }, storeId: 'mana-shop' } as any,
        { score: { $meta: 'textScore' }, title: 1, plainDescription: 1, price: 1, vendor: 1 }
      )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort({ score: { $meta: 'textScore' } } as any)
        .limit(2)
        .lean();

      for (const p of crossProducts) {
        results.push({
          source: `cross-product:mana-shop:${String(p._id)}`,
          text: `[ANDERER SHOP – mana-shop.ch] Produkt: ${p.title} | Preis: ${p.price} CHF\n${p.plainDescription}`,
        });
      }
    } catch {
      // Cross-store lookup failed; continue without it
    }
  }

  try {
    const faqs = await Faq.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $text: { $search: query } } as any,
      { score: { $meta: 'textScore' }, question: 1, answer: 1, storeId: 1 }
    )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: 'textScore' } } as any)
      .limit(4)
      .lean();

    for (const f of faqs) {
      const isKendra = f.storeId === 'mana-kendra';
      const prefix = isKendra ? '[MANA KENDRA ANGEBOT] ' : '';
      results.push({
        source: `faq:${String(f._id)}`,
        text: `${prefix}Frage: ${f.question}\nAntwort: ${f.answer}`,
      });
    }
  } catch {
    // Text index may not exist yet; skip FAQ context gracefully
  }

  return results;
}

// --- System prompt ---

function buildSystemPrompt(storeId: string, contextDocs: ContextDoc[], businessContext = ''): string {
  const storeName = storeId === 'mana-shop' ? 'Mana Shop' : 'Mana Kendra';
  const otherStoreName = storeId === 'mana-shop' ? 'Mana Kendra' : 'Mana Shop';

  let prompt = `Du bist der offizielle KI-Assistent von ${storeName} (${storeId}.ch).

WICHTIG: Im Kontext unten können interne Markierungen wie [MANA KENDRA ANGEBOT] oder [ANDERER SHOP – ...] vorkommen. Diese sind NUR für dich als Hinweis gedacht. Schreibe sie NIEMALS in deine Antwort an den Kunden. Der Kunde soll diese Tags nie sehen.

SPRACHE: Erkenne die Sprache des Kunden automatisch und antworte IMMER in derselben Sprache (Deutsch oder Englisch).

DEINE EINZIGE AUFGABE – du darfst NUR über folgende Themen sprechen:
• Produkte von ${storeName} und ${otherStoreName}
• Preise, Verfügbarkeit, Produktdetails
• Bestellungen, Lieferzeiten, Versand, Rücksendungen
• Massagen und Behandlungen buchen (Mana Kendra)
• Beratungstermine
• Allgemeine Shop-Anfragen zu ${storeName} oder ${otherStoreName}

UMGANG MIT UNBEKANNTEN ANFRAGEN:
Wenn ein Kunde nach etwas fragt, das du nicht kennst oder das nicht in unserem Angebot ist, lehne NIEMALS ab. Stattdessen:
• Erkläre kurz, dass du das spezifische Angebot nicht kennst
• Empfehle das ähnlichste Angebot aus unserem Sortiment
• Gib den Buchungslink oder Kontakt an
Beispiel: Wenn jemand nach "Carnotherapie" fragt → sage "Diese Behandlung kenne ich nicht genau, aber bei Mana Kendra bieten wir ähnliche Körpertherapien wie Craniosacrale Therapie, Lomi Lomi oder klassische Massage an. Buchung: mana-kendra.ch/massage-behandlung"

CROSS-SHOP EMPFEHLUNGEN:
${storeId === 'mana-shop'
  ? `Mana Kendra (mana-kendra.ch) ist unser Schwester-Unternehmen für Massagen, Yoga, Ayurveda und ganzheitliche Therapien – es verkauft KEINE Produkte online.
Empfehle Mana Kendra aktiv, wenn der Kunde nach Massagen, Yoga, Entspannung, Stress, Therapien, Ayurveda, Behandlungen, Körperpflege oder Wohlbefinden fragt.
Wenn du im Kontext unten Einträge siehst, die mit [MANA KENDRA ANGEBOT] markiert sind, nenne diese konkret mit Name und Buchungslink.
Empfehle NIEMALS Produkte von Mana Kendra – dort gibt es keine Produkte zu kaufen, nur Behandlungen und Kurse.`
  : `Wenn du im Kontext Produkte siehst, die mit [ANDERER SHOP – mana-shop.ch] markiert sind, empfehle diese aktiv mit dem genauen Produktnamen und dem Hinweis "Du findest es bei unserem Mana Shop unter mana-shop.ch". Nenne IMMER den spezifischen Produktnamen – nie nur "besuche den anderen Shop".`
}

BERATUNGSTERMIN-BUCHUNG:
Wenn der Kunde nach Beratung, Coaching, Therapie fragt oder sich gestresst/überfordert fühlt:
"Für eine persönliche Beratung kannst du hier kostenlos einen Termin buchen: https://kostenlose-beratung-buchen.youcanbook.me/"
(English: "You can book a free consultation here: https://kostenlose-beratung-buchen.youcanbook.me/")

${storeId === 'mana-kendra' ? `MASSAGE & BEHANDLUNGEN BUCHEN:
Wenn der Kunde eine Massage oder Behandlung buchen möchte:
"Du kannst deine Massage-Behandlung direkt hier buchen: https://www.mana-kendra.ch/massage-behandlung"
(English: "You can book your massage treatment directly here: https://www.mana-kendra.ch/massage-behandlung")` : ''}

VERSAND & LIEFERZEITEN:
• Versand B (Standard): ca. 3–12 Werktage ab Zahlungseingang
• Versand A (Priority): ca. 1–3 Werktage ab Zahlungseingang
• Express: nächster Werktag bei Bestellung bis 14:00 Uhr (auch samstags), ab Zahlungseingang
Versand startet erst nach bestätigtem Zahlungseingang.
(English: Standard 3–12 days, Priority 1–3 days, Express next business day before 2PM. All from payment confirmation.)

LÄNGE & FORMAT – strikt einhalten:
• Antworte KURZ: maximal 3–4 Zeilen oder 3 Aufzählungspunkte. Nie länger.
• Jeder Aufzählungspunkt MUSS auf einer eigenen Zeile stehen – trenne jeden Punkt mit einem Zeilenumbruch (\n). Niemals mehrere Punkte in einem Satz hintereinander.
• Beispiel korrektes Format:
Wir empfehlen:
• Klassische Massage
• Yoga
• Ayurveda
Buchen: mana-kendra.ch/massage-behandlung
• Verwende KEINE Markdown-Sternchen (*fett*, _kursiv_)
• Buchungslink nur einmal ganz am Ende
• Keine Einleitungssätze wie "Gerne helfe ich dir" oder "Das ist eine gute Frage"

Ton: Warm, direkt, professionell. Weniger ist mehr.`;

  if (businessContext) {
    prompt += '\n\n--- ZUSÄTZLICHE GESCHÄFTSINFORMATIONEN (höchste Priorität) ---\n';
    prompt += businessContext;
    prompt += '\n--- ENDE DER GESCHÄFTSINFORMATIONEN ---';
  }

  if (contextDocs.length > 0) {
    prompt += '\n\n--- RELEVANTE PRODUKTINFORMATIONEN & FAQs ---\n';
    for (const doc of contextDocs) {
      prompt += `\n${doc.text}\n`;
    }
    prompt += '\n--- ENDE DER KONTEXTINFORMATIONEN ---';
    prompt += '\n\nBeziehe dich auf die obigen Informationen, wenn sie für die Frage des Kunden relevant sind.';
  }

  return prompt;
}

// --- Human handoff detection ---

const HUMAN_TRIGGERS = [
  'talk to human', 'real human', 'human agent', 'speak to someone', 'speak to a person',
  'real person', 'live agent', 'live person', 'escalate', 'support agent', 'real support',
  'mit mensch', 'echter mensch', 'mensch sprechen', 'echten mitarbeiter', 'menschlichen support',
  'persönlichen berater', 'echten berater', 'support mitarbeiter',
];

// Single words that alone mean "connect me to a human" (used in email replies)
const HUMAN_EXACT_WORDS = ['human', 'mensch', 'person', 'agent'];

function detectHumanRequest(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (HUMAN_EXACT_WORDS.includes(lower)) return true;
  return HUMAN_TRIGGERS.some((t) => lower.includes(t));
}

const HANDOFF_REPLY =
  "I'm connecting you with a human support agent. Our team will respond to you shortly — please hold on.\n\nIch verbinde Sie mit einem menschlichen Support-Mitarbeiter. Unser Team wird sich in Kürze bei Ihnen melden — bitte haben Sie einen Moment Geduld.";

const HUMAN_WAIT_REPLY =
  "A human support agent will respond to you shortly. Please hold on.\n\nEin menschlicher Support-Mitarbeiter wird sich in Kürze bei Ihnen melden. Bitte haben Sie Geduld.";

// --- Lead capture ---

const SERVICE_KEYWORDS = [
  'massage', 'therapie', 'therapy', 'yoga', 'behandlung', 'treatment', 'buchen', 'book',
  'termin', 'appointment', 'burnout', 'stress', 'entspannung', 'relaxation', 'ayurveda',
  'craniosacral', 'hypno', 'reiki', 'meditation', 'qi gong', 'coaching', 'beratung',
  'lomi', 'schwangerschaft', 'pregnancy', 'trauma', 'kinesiologie', 'klang', 'sound',
  'rückbildung', 'beckenboden', 'ernährung', 'nutrition', 'gesundheit', 'health',
];

function detectServiceInterest(message: string): boolean {
  const lower = message.toLowerCase();
  return SERVICE_KEYWORDS.some((k) => lower.includes(k));
}

function extractContact(message: string): { phone?: string; email?: string } {
  const emailMatch = message.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = message.match(/(\+?\d[\d\s\-().]{6,}\d)/);
  return {
    email: emailMatch?.[0],
    phone: phoneMatch?.[0]?.replace(/\s+/g, ' ').trim(),
  };
}

const CONTACT_REQUEST_DE = '\n\nDarf ich kurz deine Telefonnummer oder E-Mail-Adresse haben, damit wir uns bei dir melden können?';
const CONTACT_REQUEST_EN = '\n\nCan I get your phone number or email address so we can follow up with you?';

function contactSavedReply(storeId: string, isEnglish: boolean): string {
  const bookingLink = storeId === 'mana-kendra'
    ? 'https://www.mana-kendra.ch/massage-behandlung'
    : 'https://kostenlose-beratung-buchen.youcanbook.me/';
  return isEnglish
    ? `Perfect, thank you! We'll be in touch soon.\n\nYou can also book directly here: ${bookingLink}`
    : `Super, danke! Wir melden uns bald bei dir.\n\nDu kannst auch direkt hier buchen: ${bookingLink}`;
}

function detectNoContact(message: string): boolean {
  return /no email|keine email|kein email|don'?t have.*email|hab(e)? keine|without email|nur telefon|only phone|no mail|kein mail/i.test(message);
}

const CONTACT_RETRY_DE = 'Kein Problem! Deine Telefonnummer reicht völlig aus. Wie lautet sie?';
const CONTACT_RETRY_EN = 'No problem! Your phone number is enough. What is it?';

// --- Response formatter ---
// Ensures bullet points always appear on their own lines regardless of how the AI outputs them.
function formatBullets(text: string): string {
  // Split inline bullets: "text • item • item" → proper newlines
  let out = text
    .replace(/ • /g, '\n• ')   // space-bullet-space → newline-bullet
    .replace(/([^\n])•/g, '$1\n•'); // bullet not preceded by newline → add newline

  // Collapse 3+ consecutive blank lines to 2
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

// --- BrainService ---

export class BrainService {
  private aiProvider: IAIProvider;

  constructor(aiProvider?: IAIProvider) {
    this.aiProvider = aiProvider ?? new OpenAIProvider();
  }

  async process(input: BrainInput): Promise<BrainOutput> {
    const { userMessage, sessionId, channel, storeId, requestHuman, customerContact } = input;

    // 1. Load conversation history (last 10 messages) — graceful if DB is down
    let conversation: InstanceType<typeof Conversation> | null = null;
    let recentMessages: Array<{ role: string; content: string }> = [];
    try {
      conversation = await Conversation.findOne({ sessionId, channel });
      if (!conversation) {
        conversation = new Conversation({ channel, sessionId, storeId, messages: [], status: 'ai' });
      }
      // Store customerContact when provided
      if (customerContact && !conversation.customerContact) {
        conversation.customerContact = customerContact;
      }
      recentMessages = conversation.messages.slice(-10);
    } catch {
      // DB unavailable — continue without history
    }

    // 2. If conversation is already in human mode — store message, skip AI
    if (conversation && (conversation.status === 'human_pending' || conversation.status === 'human')) {
      try {
        conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });
        await conversation.save();
      } catch {
        // DB unavailable
      }
      return {
        reply: HUMAN_WAIT_REPLY,
        tokensUsed: 0,
        contextSources: [],
        conversationStatus: conversation.status,
      };
    }

    // 3. Check if this message triggers a human handoff
    const isHandoffRequest = requestHuman === true || detectHumanRequest(userMessage);

    if (isHandoffRequest) {
      if (conversation) {
        try {
          conversation.status = 'human_pending';
          conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });
          conversation.messages.push({ role: 'assistant', content: HANDOFF_REPLY, timestamp: new Date() });
          await conversation.save();
        } catch {
          // DB unavailable
        }
      }
      return {
        reply: HANDOFF_REPLY,
        tokensUsed: 0,
        contextSources: [],
        handoffTriggered: true,
        conversationStatus: 'human_pending',
      };
    }

    // 4. Lead capture — handle contact awaiting state
    if (conversation?.awaitingContact && !conversation.leadCaptured) {
      const contact = extractContact(userMessage);
      const isEnglish = /\b(i|my|me|please|yes|no|thank|hello|hi|what|do|you|can|how|offer)\b/i.test(userMessage);

      // User switched topic — reset and let AI answer normally
      const isNewQuestion = !contact.phone && !contact.email && !detectNoContact(userMessage) && userMessage.trim().split(/\s+/).length > 4;
      if (isNewQuestion) {
        try { conversation.awaitingContact = false; await conversation.save(); } catch { /* ignore */ }
        // fall through to normal AI processing below
      } else if (contact.phone || contact.email) {
        // Got at least one contact — save lead
        try {
          await Lead.create({
            phone: contact.phone ?? '',
            email: contact.email ?? '',
            interest: conversation.messages.slice(-6).find(m => m.role === 'user')?.content ?? '',
            sessionId,
            storeId,
            channel,
          });
          conversation.awaitingContact = false;
          conversation.leadCaptured = true;
          const reply = contactSavedReply(storeId, isEnglish);
          conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });
          conversation.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
          await conversation.save();
          broadcastNotification(
            'New Lead',
            `${contact.phone || contact.email} — ${storeId === 'mana-kendra' ? 'Mana Kendra' : 'Mana Shop'}`,
            { screen: 'leads' }
          ).catch(() => {});
        } catch { /* DB unavailable */ }
        return { reply: contactSavedReply(storeId, isEnglish), tokensUsed: 0, contextSources: [] };
      } else if (detectNoContact(userMessage)) {
        // User said they don't have email — ask only for phone
        const reply = isEnglish ? CONTACT_RETRY_EN : CONTACT_RETRY_DE;
        try {
          conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });
          conversation.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
          await conversation.save();
        } catch { /* DB unavailable */ }
        return { reply, tokensUsed: 0, contextSources: [] };
      } else {
        // Short unrecognized reply — re-ask gently
        const reply = isEnglish
          ? 'No worries! Just your phone number or email is enough.'
          : 'Kein Problem! Deine Telefonnummer oder E-Mail-Adresse reicht völlig.';
        try {
          conversation.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });
          conversation.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
          await conversation.save();
        } catch { /* DB unavailable */ }
        return { reply, tokensUsed: 0, contextSources: [] };
      }
    }

    // 4b. Retrieve relevant context from products + FAQs
    const contextDocs = await retrieveContext(userMessage, storeId);
    const contextSources = contextDocs.map((d) => d.source);

    // 5. Load custom business context set via dashboard
    let businessContextText = '';
    try {
      const ctx = await BusinessContext.findOne({}).lean();
      businessContextText = ctx?.content?.trim() ?? '';
    } catch { /* DB unavailable */ }

    // 6. Build OpenAI messages array
    const systemPrompt = buildSystemPrompt(storeId, contextDocs, businessContextText);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of recentMessages) {
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    messages.push({ role: 'user', content: userMessage });

    // 6. Call AI provider
    const result = await this.aiProvider.complete({
      messages,
      model: env.OPENAI_MODEL,
      temperature: 0.4,
    });

    result.text = formatBullets(result.text);

    // 7. If service interest detected and no lead yet, append contact request
    const isRefusal = false; // bot no longer rejects — always tries to help
    if (conversation && !conversation.leadCaptured && !conversation.awaitingContact && detectServiceInterest(userMessage) && !isRefusal) {
      const isEnglish = /\b(i|my|me|please|yes|no|thank|hello|hi|what|do|you|can|how)\b/i.test(userMessage);
      result.text += isEnglish ? CONTACT_REQUEST_EN : CONTACT_REQUEST_DE;
      conversation.awaitingContact = true;
    }

    // 8. Persist new user + assistant messages — graceful if DB is down
    if (conversation) {
      try {
        const now = new Date();
        conversation.messages.push({ role: 'user', content: userMessage, timestamp: now });
        conversation.messages.push({ role: 'assistant', content: result.text, timestamp: now });
        await conversation.save();
      } catch {
        // DB unavailable — reply still sent, history not saved
      }
    }

    return {
      reply: result.text,
      tokensUsed: result.tokensUsed,
      contextSources,
      conversationStatus: conversation?.status ?? 'ai',
    };
  }
}

export const brainService = new BrainService();
