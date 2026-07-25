import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
const result = await auth.listUsers(50);
console.log('\n--- Firebase Auth Users ---');
result.users.forEach(u => console.log(`uid: ${u.uid}  email: ${u.email}  displayName: ${u.displayName ?? '(none)'}`));
console.log('---------------------------\n');
