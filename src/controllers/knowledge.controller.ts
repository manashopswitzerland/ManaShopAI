import type { Request, Response, NextFunction } from 'express';
import { Faq } from '../models/faq.model';
import { BusinessContext } from '../models/business-context.model';

// ── FAQs ──────────────────────────────────────────────────────────

export async function listFaqs(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const faqs = await Faq.find({}).sort({ createdAt: -1 }).lean();
    res.json({ faqs });
  } catch (err) { next(err); }
}

export async function createFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { question, answer, tags, language, storeId } = req.body as {
      question: string; answer: string; tags?: string[]; language?: string; storeId?: string;
    };
    if (!question?.trim() || !answer?.trim()) {
      res.status(400).json({ error: 'question and answer are required' });
      return;
    }
    const faq = new Faq({
      question: question.trim(),
      answer: answer.trim(),
      tags: Array.isArray(tags) ? tags : [],
      language: language === 'en' ? 'en' : 'de',
      storeId: storeId === 'mana-kendra' ? 'mana-kendra' : 'mana-shop',
    });
    await faq.save();
    res.json({ faq });
  } catch (err) { next(err); }
}

export async function updateFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { question, answer, tags, language, storeId } = req.body as {
      question: string; answer: string; tags?: string[]; language?: string; storeId?: string;
    };
    if (!question?.trim() || !answer?.trim()) {
      res.status(400).json({ error: 'question and answer are required' });
      return;
    }
    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      {
        question: question.trim(),
        answer: answer.trim(),
        tags: Array.isArray(tags) ? tags : [],
        language: language === 'en' ? 'en' : 'de',
        storeId: storeId === 'mana-kendra' ? 'mana-kendra' : 'mana-shop',
      },
      { new: true }
    );
    if (!faq) { res.status(404).json({ error: 'FAQ not found' }); return; }
    res.json({ faq });
  } catch (err) { next(err); }
}

export async function deleteFaq(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Faq.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// ── Business Context ──────────────────────────────────────────────

export async function getContext(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ctx = await BusinessContext.findOne({}).lean();
    res.json({ content: ctx?.content ?? '' });
  } catch (err) { next(err); }
}

export async function updateContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = req.body as { content: string };
    await BusinessContext.findOneAndUpdate({}, { content: content ?? '' }, { upsert: true, new: true });
    res.json({ success: true });
  } catch (err) { next(err); }
}
