import type { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/lead.model';

export async function listLeads(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    res.json({ leads });
  } catch (err) { next(err); }
}

export async function updateLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = req.body as { status: string };
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json({ lead });
  } catch (err) { next(err); }
}

export async function deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getLeadCount(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await Lead.countDocuments({ status: 'new' });
    res.json({ count });
  } catch (err) { next(err); }
}
