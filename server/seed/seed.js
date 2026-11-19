import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { addDays } from '../utils/helpers.js';

const force = process.argv.includes('--force');

const adminCredentials = {
  name: 'Ava Thompson',
  email: 'admin@library.com',
  password: 'Admin@12345',
  role: 'admin',
  phone: '+1 555 010 1000',
};

const categories = [
  { name: 'Fiction', description: 'Novels and literary works', color: '#8b5cf6', icon: 'BookOpen' },
  { name: 'Science', description: 'Scientific books and research', color: '#0ea5e9', icon: 'FlaskConical' },
  { name: 'Technology', description: 'Computing and engineering', color: '#14b8a6', icon: 'Cpu' },
  { name: 'History', description: 'History and biography', color: '#f59e0b', icon: 'Landmark' },
  { name: 'Business', description: 'Business and economics', color: '#ec4899', icon: 'Briefcase' },
  { name: 'Children', description: 'Books for young readers', color: '#22c55e', icon: 'Baby' },
];

const books = [
  ['To Kill a Mockingbird', 'Harper Lee', 'Fiction', 9780061120084, 1960, 6, 4],
  ['1984', 'George Orwell', 'Fiction', 9780451524935, 1949, 8, 5],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 9780743273565, 1925, 5, 5],
  ['A Brief History of Time', 'Stephen Hawking', 'Science', 9780553380163, 1988, 4, 2],
  ['The Selfish Gene', 'Richard Dawkins', 'Science', 9780192860927, 1976, 3, 0],
  ['Clean Code', 'Robert C. Martin', 'Technology', 9780132350884, 2008, 5, 3],
  ['The Pragmatic Programmer', 'Andrew Hunt', 'Technology', 9780201616224, 1999, 4, 1],
  ['Introduction to Algorithms', 'Thomas H. Cormen', 'Technology', 9780262033848, 2009, 3, 0],
  ['Sapiens', 'Yuval Noah Harari', 'History', 9780062316097, 2011, 6, 4],
  ['The Art of War', 'Sun Tzu', 'History', 9781590302255, 1910, 4, 3],
  ['Rich Dad Poor Dad', 'Robert Kiyosaki', 'Business', 9781612680194, 1997, 5, 2],
  ['Zero to One', 'Peter Thiel', 'Business', 9780309278351, 2014, 3, 1],
  ['The Cat in the Hat', 'Dr. Seuss', 'Children', 9780394800011, 1957, 5, 5],
  ['Matilda', 'Roald Dahl', 'Children', 9780142410370, 1988, 4, 2],
  ['Atomic Habits', 'James Clear', 'Business', 9780735211292, 2018, 7, 6],
  ['Dune', 'Frank Herbert', 'Fiction', 9780441013593, 1965, 5, 4],
];

const members = [
  ['Liam Carter', 'liam.carter@student.edu', 'STU-1001', '+1 555 010 2001'],
  ['Olivia Bennett', 'olivia.bennett@student.edu', 'STU-1002', '+1 555 010 2002'],
  ['Noah Williams', 'noah.williams@student.edu', 'STU-1003', '+1 555 010 2003'],
  ['Emma Rodriguez', 'emma.rodriguez@student.edu', 'STU-1004', '+1 555 010 2004'],
  ['Ethan Brooks', 'ethan.brooks@student.edu', 'STU-1005', '+1 555 010 2005'],
  ['Sophia Nguyen', 'sophia.nguyen@student.edu', 'STU-1006', '+1 555 010 2006'],
  ['Mason Patel', 'mason.patel@student.edu', 'STU-1007', '+1 555 010 2007'],
  ['Isabella Rivera', 'isabella.rivera@student.edu', 'STU-1008', '+1 555 010 2008'],
];

const run = async () => {
  await connectDB();

  const existing = await User.countDocuments();
  if (existing && !force) {
    console.log('Seed skipped: database already has users. Use `npm run seed -- --force` to reset.');
    await disconnectDB();
    return;
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Book.deleteMany({}),
      Borrow.deleteMany({}),
      Fine.deleteMany({}),
      Reservation.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
  }

  const admin = await User.create(adminCredentials);
  const librarian = await User.create({
    name: 'Grace Miller',
    email: 'librarian@library.com',
    password: 'Librarian@123',
    role: 'librarian',
    phone: '+1 555 010 1001',
  });

  const createdCategories = await Category.insertMany(categories);
  const categoryByName = Object.fromEntries(createdCategories.map((c) => [c.name, c._id]));

  const createdBooks = await Book.insertMany(
    books.map(([title, author, category, isbn, publicationYear, totalCopies, availableCopies], i) => ({
      title,
      author,
      category: categoryByName[category],
      isbn,
      publicationYear,
      totalCopies,
      availableCopies,
      publisher: ['Penguin', 'HarperCollins', 'MIT Press', 'Oxford University Press'][i % 4],
      description: `${title} by ${author}. A sought-after title in our ${category} collection.`,
      shelfLocation: `Aisle ${String.fromCharCode(65 + (i % 6))}-${10 + i}`,
      tags: [category.toLowerCase(), 'bestseller'],
      addedBy: admin._id,
    }))
  );

  const createdMembers = await User.insertMany(
    members.map(([name, email, studentId, phone], i) => ({
      name,
      email,
      password: 'Member@123',
      role: 'member',
      studentId,
      phone,
      address: `${100 + i} Campus Drive`,
      membershipDate: new Date(Date.now() - (90 - i * 7) * 86_400_000),
    }))
  );

  const now = new Date();
  const borrowData = [
    [createdBooks[0], createdMembers[0], -2, 12, 'issued'],
    [createdBooks[1], createdMembers[1], -9, 5, 'issued'],
    [createdBooks[5], createdMembers[2], -3, 11, 'issued'],
    [createdBooks[8], createdMembers[3], -20, -6, 'issued'],
    [createdBooks[10], createdMembers[4], -1, 13, 'issued'],
    [createdBooks[2], createdMembers[5], -30, -16, 'returned'],
    [createdBooks[6], createdMembers[6], -60, -46, 'returned'],
    [createdBooks[14], createdMembers[7], -15, -1, 'returned'],
    [createdBooks[15], createdMembers[0], -45, -31, 'returned'],
    [createdBooks[9], createdMembers[2], -75, -61, 'returned'],
  ];

  const borrows = await Borrow.insertMany(
    borrowData.map(([book, member, issuedOffset, dueOffset, status], i) => {
      const issueDate = addDays(now, issuedOffset);
      const dueDate = addDays(now, dueOffset);
      const returnDate = status === 'returned' ? addDays(now, dueOffset + 2) : null;
      const daysLate = status === 'returned' ? Math.max(0, Math.ceil((returnDate - dueDate) / 86_400_000)) : 0;
      return {
        book: book._id,
        member: member._id,
        issuedBy: librarian._id,
        issueDate,
        dueDate,
        returnDate,
        status,
        fineAmount: daysLate * 5,
        finePaid: daysLate === 0,
        notes: i === 3 ? 'Reminder sent to member' : '',
      };
    })
  );

  await Book.updateOne({ _id: createdBooks[0]._id }, { availableCopies: 3 });
  await Book.updateOne({ _id: createdBooks[1]._id }, { availableCopies: 4 });
  await Book.updateOne({ _id: createdBooks[5]._id }, { availableCopies: 2 });
  await Book.updateOne({ _id: createdBooks[8]._id }, { availableCopies: 3 });
  await Book.updateOne({ _id: createdBooks[10]._id }, { availableCopies: 1 });

  await Fine.insertMany([
    {
      member: createdMembers[3]._id,
      borrow: borrows[3]._id,
      book: createdBooks[8]._id,
      amount: 80,
      reason: 'overdue',
      description: 'Late return: 16 days overdue',
    },
    {
      member: createdMembers[5]._id,
      borrow: borrows[5]._id,
      book: createdBooks[2]._id,
      amount: 10,
      reason: 'overdue',
      status: 'paid',
      paidAt: addDays(now, -12),
      description: 'Late return: 2 days overdue',
    },
    {
      member: createdMembers[1]._id,
      book: createdBooks[1]._id,
      amount: 25,
      reason: 'damage',
      description: 'Damaged cover',
    },
  ]);

  await Reservation.insertMany([
    {
      book: createdBooks[4]._id,
      member: createdMembers[6]._id,
      reservedAt: addDays(now, -3),
      status: 'pending',
    },
    {
      book: createdBooks[7]._id,
      member: createdMembers[7]._id,
      reservedAt: addDays(now, -2),
      status: 'pending',
    },
    {
      book: createdBooks[7]._id,
      member: createdMembers[0]._id,
      reservedAt: addDays(now, -1),
      status: 'pending',
    },
  ]);

  await Notification.insertMany([
    {
      recipient: createdMembers[3]._id,
      type: 'fine_created',
      title: 'Overdue fine',
      message: 'A fine of $80 was added for a late return.',
      link: '/fines',
    },
    {
      recipient: createdMembers[0]._id,
      type: 'book_issued',
      title: 'Book issued',
      message: 'To Kill a Mockingbird has been issued to you.',
      link: '/my-borrows',
    },
  ]);

  await ActivityLog.insertMany([
    {
      actor: admin._id,
      action: 'SYSTEM_SEEDED',
      entity: 'System',
      description: 'Sample library data was seeded',
    },
    {
      actor: librarian._id,
      action: 'BOOK_ISSUED',
      entity: 'Borrow',
      description: 'Several books issued to members',
    },
  ]);

  console.log('\nSeed completed successfully.');
  console.log('Default accounts (change these passwords in production):');
  console.log(`  Admin     → ${adminCredentials.email} / ${adminCredentials.password}`);
  console.log(`  Librarian → librarian@library.com / Librarian@123`);
  console.log(`  Member    → liam.carter@student.edu / Member@123\n`);

  await disconnectDB();
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await disconnectDB();
  process.exit(1);
});
