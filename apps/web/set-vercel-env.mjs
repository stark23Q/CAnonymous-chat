import { execSync } from 'child_process';

try { execSync('npx vercel env rm NEXT_PUBLIC_API_URL production -y'); } catch (e) {}
try { execSync('npx vercel env rm NEXT_PUBLIC_SOCKET_URL production -y'); } catch (e) {}

const url = 'https://anonymous-chatapi-production.up.railway.app';

console.log('Adding NEXT_PUBLIC_API_URL...');
execSync('npx vercel env add NEXT_PUBLIC_API_URL production', { input: url });

console.log('Adding NEXT_PUBLIC_SOCKET_URL...');
execSync('npx vercel env add NEXT_PUBLIC_SOCKET_URL production', { input: url });

console.log('Envs added successfully!');
