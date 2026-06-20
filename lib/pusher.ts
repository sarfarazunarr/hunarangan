import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
let pusherServerInstance: PusherServer | null = null;

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

if (appId && key && secret) {
  pusherServerInstance = new PusherServer({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
} else {
  console.warn('Pusher server environment variables are missing. Running in simulated offline Mode.');
}

export const pusherServer = pusherServerInstance;

// Client-side Pusher client helper
export function getPusherClient(): PusherClient | null {
  const publicClientKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!publicClientKey) {
    console.warn('NEXT_PUBLIC_PUSHER_KEY is not defined. Pusher client disabled.');
    return null;
  }
  return new PusherClient(publicClientKey, {
    cluster,
    forceTLS: true,
  });
}
