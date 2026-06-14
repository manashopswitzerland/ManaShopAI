import OpenAI from 'openai';
import { env } from '../config/env';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = env.KENDRA_OPENAI_API_KEY || env.OPENAI_API_KEY;
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

// Strip OpenAI citation markers like 【4:0†source】 from responses
function stripCitations(text: string): string {
  return text.replace(/【[^】]*】/g, '').trim();
}

export function isKendraAssistantEnabled(): boolean {
  return Boolean(env.KENDRA_ASSISTANT_ID);
}

export async function callKendraAssistant(params: {
  sessionId: string;
  userMessage: string;
  additionalInstructions: string;
  threadId?: string | null;
}): Promise<{ reply: string; threadId: string; tokensUsed: number }> {
  const { sessionId: _sessionId, userMessage, additionalInstructions, threadId } = params;
  const openai = getClient();
  const assistantId = env.KENDRA_ASSISTANT_ID;

  // Reuse existing thread or create a new one
  let tid = threadId ?? undefined;
  if (!tid) {
    const thread = await openai.beta.threads.create();
    tid = thread.id;
  }

  await openai.beta.threads.messages.create(tid, {
    role: 'user',
    content: userMessage,
  });

  const run = await openai.beta.threads.runs.createAndPoll(tid, {
    assistant_id: assistantId,
    additional_instructions: additionalInstructions,
  });

  if (run.status !== 'completed') {
    throw new Error(`Kendra assistant run failed with status: ${run.status}`);
  }

  const messages = await openai.beta.threads.messages.list(tid, {
    order: 'desc',
    limit: 1,
  });

  const content = messages.data[0]?.content ?? [];
  const rawText = content
    .filter((c) => c.type === 'text')
    .map((c) => (c.type === 'text' ? c.text.value : ''))
    .join('\n');

  const reply = stripCitations(rawText);
  const tokensUsed = run.usage?.total_tokens ?? 0;

  return { reply, threadId: tid, tokensUsed };
}
