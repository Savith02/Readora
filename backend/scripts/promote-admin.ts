import { connectDB, disconnectDB } from '../src/config/db';
import { User } from '../src/models';

async function main() {
  const [email, confirmation] = process.argv.slice(2);
  if (!email || confirmation !== '--confirm') throw new Error('Usage: npm run admin:promote -w backend -- <existing-account-email> --confirm');
  try {
    await connectDB();
    const user = await User.findOneAndUpdate({ email: email.trim().toLowerCase(), role: 'user' }, { $set: { role: 'admin' } }, { new: true });
    if (!user) throw new Error('No reader account found; register the account first, or check whether it is already an administrator.');
    console.log('Account promoted to administrator. Sign in through the shared login page.');
  } finally { await disconnectDB(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
