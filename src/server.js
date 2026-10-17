import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN.split(',') }));
app.use(express.json({ limit: '20kb' }));

const schema = z.object({
  idempotency_key: z.string().uuid(),
  name: z.string().trim().min(3).max(80),
  phone: z.string().trim().regex(/^0[567]\d{8}$/, 'رقم هاتف غير صالح'),
  wilaya: z.string().trim().min(2).max(40),
  commune: z.string().trim().min(2).max(60),
  address: z.string().trim().min(5).max(250),
  notes: z.string().trim().max(500).optional().default(''),
  items: z.array(z.object({ variant_id: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
});

app.post('/api/orders', rateLimit({ windowMs: 60_000, limit: 10 }), async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { data, error } = await db.rpc('create_order', { p: parsed.data });
  if (error) return res.status(409).json({ error: error.message });
  const { data: order } = await db.from('orders').select('*, order_items(*)').eq('id', data.id).single();
  const { data: s } = await db.from('store_settings').select('value').eq('key', 'whatsapp').single();
  res.json({ order, whatsapp: s?.value || '213796006953' });
});

app.listen(process.env.PORT || 4000, () => console.log('API ready'));
