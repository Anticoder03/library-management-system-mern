/** Verifies the seed script against a temporary in-memory MongoDB. */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';
import mongoose from 'mongoose';

const memory = await MongoMemoryServer.create();
const uri = memory.getUri('seed_test');

const child = spawn(process.execPath, ['seed/seed.js'], {
  cwd: process.cwd(),
  env: { ...process.env, MONGO_URI: uri },
  stdio: 'inherit',
});

const code = await new Promise((resolve) => child.on('exit', resolve));
if (code !== 0) {
  await memory.stop();
  process.exit(code);
}

await mongoose.connect(uri);
const { User } = await import('../models/User.js');
const { Book } = await import('../models/Book.js');
const { Category } = await import('../models/Category.js');
const { Borrow } = await import('../models/Borrow.js');
const { Reservation } = await import('../models/Reservation.js');
const { Fine } = await import('../models/Fine.js');

const counts = {
  users: await User.countDocuments(),
  books: await Book.countDocuments(),
  categories: await Category.countDocuments(),
  borrows: await Borrow.countDocuments(),
  reservations: await Reservation.countDocuments(),
  fines: await Fine.countDocuments(),
};
console.log('Seed collection counts:', counts);

const ok =
  counts.users === 10 &&
  counts.books === 16 &&
  counts.categories === 6 &&
  counts.borrows === 10 &&
  counts.reservations === 3 &&
  counts.fines === 3;

await mongoose.disconnect();
await memory.stop();
console.log(ok ? 'Seed verification passed ✓' : 'Seed verification failed ✗');
process.exit(ok ? 0 : 1);
