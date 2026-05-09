import OpenAI from 'openai';
import { env } from '../config/env';
import { Product } from '../models/product.model';
import { Faq } from '../models/faq.model';
import { Conversation } from '../models/conversation.model';
import { BusinessContext } from '../models/business-context.model';
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

  try {
    const faqs = await Faq.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { $text: { $search: query } } as any,
      { score: { $meta: 'textScore' }, question: 1, answer: 1 }
    )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort({ score: { $meta: 'textScore' } } as any)
      .limit(2)
      .lean();

    for (const f of faqs) {
      results.push({
        source: `faq:${String(f._id)}`,
        text: `Frage: ${f.question}\nAntwort: ${f.answer}`,
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

  let prompt = `Du bist ein Kundenservice-Assistent für ${storeName} (${storeId}.ch), einen Online-Shop für Wellness-, Spiritualitäts- und Naturprodukte.

STRIKTE GRENZEN – was du tust:
- Erkenne die Sprache des Kunden automatisch und antworte IMMER in derselben Sprache (Deutsch oder Englisch).
- Beantworte NUR Fragen zu: unseren Produkten, Bestellungen, Lieferzeiten, Preisen, Rücksendungen und allgemeinen Shop-Anfragen.
- Beziehe dich auf Produktinformationen aus dem Kontext, wenn sie relevant sind.
- Erfinde NIEMALS Produktinformationen, Preise oder Verfügbarkeiten.

STRIKTE GRENZEN – was du NICHT tust:
- Beantworte KEINE allgemeinen Fragen, die nichts mit dem Shop oder unseren Produkten zu tun haben. Kein Allgemeinwissen, keine Lebenstipps, keine Ernährungsberatung, keine medizinischen Ratschläge, keine generischen Wellness-Tipps – nichts davon.
- Wenn jemand ein Thema anspricht, das nicht direkt mit unseren Produkten oder dem Shop zusammenhängt, antworte freundlich aber klar: "Dazu kann ich leider nicht weiterhelfen – ich beantworte nur Fragen zu unserem Shop und unseren Produkten. Bei weiteren Fragen erreichst du uns unter info@${storeId}.ch."

BERATUNGSTERMIN-BUCHUNG – höchste Priorität:
Wenn der Kunde irgendetwas sagt, das mit folgendem zusammenhängt:
- Einen Termin buchen, eine Beratung vereinbaren, einen Experten/Fachmann/Berater sprechen, professionelle Hilfe suchen
- Sich niedergeschlagen, depressiv, gestresst, überfordert, ausgebrannt, ängstlich oder emotional belastet fühlen
- Fragen zu persönlicher Beratung, Coaching, Therapie, Heilpraktiker, Naturheilkunde-Beratung
- Irgendeine Form von "ich brauche Hilfe" oder "ich weiß nicht was ich tun soll"
Dann antworte IMMER mit dem Buchungslink und empfehle einen kostenlosen Beratungstermin:
"Für eine persönliche Beratung kannst du hier kostenlos einen Termin buchen: https://kostenlose-beratung-buchen.youcanbook.me/"
(auf Englisch: "You can book a free consultation appointment here: https://kostenlose-beratung-buchen.youcanbook.me/")
Füge diese Empfehlung natürlich und einfühlsam in deine Antwort ein.

${storeId === 'mana-kendra' ? `MASSAGE & BEHANDLUNGEN BUCHEN – höchste Priorität:
Wenn der Kunde eine Massage buchen möchte, nach Massagebehandlungen fragt, oder Begriffe wie "Massage", "Behandlung", "buchen", "Termin", "Wellness-Termin" erwähnt, dann antworte IMMER mit diesem Link:
"Du kannst deine Massage-Behandlung direkt hier buchen: https://www.mana-kendra.ch/massage-behandlung"
(auf Englisch: "You can book your massage treatment directly here: https://www.mana-kendra.ch/massage-behandlung")
Füge diesen Link immer als klickbaren Link in deine Antwort ein.` : ''}

VERSAND & LIEFERZEITEN – immer diese genauen Informationen verwenden:
Wir haben drei Versandoptionen. Versand B (Standard) liefert in ca. 3 bis 12 Werktagen ab Zahlungseingang. Versand A (Priority) liefert in ca. 1 bis 3 Werktagen ab Zahlungseingang. Express-Versand liefert am nächsten Werktag bei Bestellung bis 14:00 Uhr, auch samstags, jeweils ab Zahlungseingang. Der Versand startet immer erst nach bestätigtem Zahlungseingang. Wenn jemand nach seiner Lieferzeit fragt und die gewählte Versandoption nicht bekannt ist, nenne alle drei Optionen freundlich.
(English version: Versand B delivers in approx. 3–12 business days from payment receipt. Versand A delivers in approx. 1–3 business days from payment receipt. Express delivers next business day for orders placed before 2:00 PM, also on Saturdays, from payment receipt. All shipping starts only after payment is confirmed.)

Formatierung: Schreibe ausschließlich in einfachem Fließtext. Verwende KEINE Markdown-Formatierung – keine Sternchen, keine Aufzählungszeichen, keine Überschriften, keine Fettschrift.

Ton: Warm, vertrauenswürdig, professionell.`;

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

    // 4. Retrieve relevant context from products + FAQs
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

    // 7. Persist new user + assistant messages — graceful if DB is down
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
