import webpush from 'web-push';

export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('\n=== Web Push VAPID Keys Generated ===');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
  console.log('=====================================\n');
  console.log('Instructions:');
  console.log('1. Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to your backend .env file.');
  console.log('2. Add VITE_VAPID_PUBLIC_KEY to your frontend .env file.\n');
  return vapidKeys;
}

// Execute CLI directly if run via tsx
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('generateVapidKeys.ts')) {
  generateVapidKeys();
}
