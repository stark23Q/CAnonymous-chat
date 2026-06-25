import { execSync } from 'child_process';

const publicKey = 'BDjlTf-jXyNAzRtCSmmRLs56rtrb97N_uhBU26qNTTXu1tJZ91KuezN728D0KizhmXIVObnrRtcVq70VIXfA8Es';

try { execSync('npx vercel env rm NEXT_PUBLIC_VAPID_PUBLIC_KEY production -y'); } catch (e) {}

console.log('Adding NEXT_PUBLIC_VAPID_PUBLIC_KEY...');
execSync('npx vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production', { input: publicKey });

console.log('Envs added successfully!');
