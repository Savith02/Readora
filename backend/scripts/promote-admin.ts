import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db';
import { User, AdminAuditLog, AdminMutationLock } from '../src/models';

async function main() {
  const [email, confirmation] = process.argv.slice(2);
  if (!email || confirmation !== '--confirm') throw new Error('Usage: npm run admin:promote -w backend -- <existing-account-email> --confirm');
  try {
    await connectDB();
    await mongoose.connection.transaction(async session => {
      await AdminMutationLock.updateOne({ _id: 'user-management' }, { $inc: { version: 1 } }, { upsert: true, session });
      if (await User.countDocuments({ role: 'admin', status: { $ne: 'suspended' } }).session(session)) throw new Error('An active administrator already exists. Use User Management to promote accounts with an audit trail.');
      const user = await User.findOneAndUpdate({ email: email.trim().toLowerCase(), role: 'user', status: { $ne: 'suspended' } }, { $set: { role: 'admin' }, $inc: { sessionVersion: 1 } }, { new: true, session });
      if (!user) throw new Error('No active reader account found. Register the account first.');
      await AdminAuditLog.create([{ administratorId: user._id, targetUserId: user._id, action: 'bootstrap_admin', previous: 'user', next: 'admin', reason: 'Initial administrator provisioned by an authorized database operator using the local CLI.' }], { session });
    });
    console.log('First administrator provisioned. Sign in through the shared login page.');
  } finally { await disconnectDB(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
