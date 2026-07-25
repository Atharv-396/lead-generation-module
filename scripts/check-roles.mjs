import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const privateKey = env.match(/FIREBASE_ADMIN_PRIVATE_KEY="([^"]+)"/)[1].replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: 'digitalheroes-71139',
    clientEmail: 'firebase-adminsdk-fbsvc@digitalheroes-71139.iam.gserviceaccount.com',
    privateKey,
  }),
  databaseURL: 'https://digitalheroes-71139-default-rtdb.firebaseio.com',
});

const auth = getAuth();
const db = getDatabase();

const result = await auth.listUsers(50);
console.log('\n--- Users & Roles ---');
for (const u of result.users) {
  const snap = await db.ref(`users/${u.uid}/role`).once('value');
  const role = snap.val() ?? '(no role in DB)';
  console.log(`${u.email.padEnd(35)} role: ${role}`);
}
console.log('---------------------\n');
