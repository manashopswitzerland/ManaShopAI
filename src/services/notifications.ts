import admin from 'firebase-admin';
import { FcmToken } from '../models/fcm-token.model';

let initialized = false;

function init() {
  if (initialized || !process.env.FCM_SERVICE_ACCOUNT_JSON) return;
  try {
    const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  } catch {
    console.warn('[FCM] Failed to initialize — FCM_SERVICE_ACCOUNT_JSON missing or invalid');
  }
}

export interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  init();
  if (!initialized) return;
  try {
    await admin.messaging().send({
      token: payload.token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: { priority: 'high', notification: { channelId: 'mana_alerts' } },
    });
  } catch (err) {
    console.error('[FCM] Send failed:', err);
  }
}

// Broadcast to all registered devices (client may have multiple)
export async function broadcastNotification(
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  init();
  if (!initialized) return;
  const tokens = await FcmToken.find().lean();
  if (!tokens.length) return;
  await Promise.allSettled(
    tokens.map(t => sendNotification({ token: t.token, title, body, data }))
  );
}
