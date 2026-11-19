/**
 * End-to-end smoke test using an in-memory MongoDB instance.
 * Run with: npm run test:integration
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const memory = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = memory.getUri('library_test');
process.env.JWT_SECRET = 'test-secret-for-integration-tests';
process.env.CLIENT_URL = 'http://localhost:5173';

const { connectDB, disconnectDB } = await import('../config/db.js');
const { default: app } = await import('../server.js');
const { User } = await import('../models/User.js');

await connectDB();

const server = app.listen(0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}/api`;

let passed = 0;
let failed = 0;
let token = '';

const request = async (method, path, body, auth = true, headers = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('json') ? await response.json() : await response.text();
  return { status: response.status, data };
};

const check = (label, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${label} ${detail}`);
  }
};

try {
  console.log('\n1. Health & authentication');
  const health = await request('GET', '/health', null, false);
  check('health endpoint is public', health.status === 200, JSON.stringify(health.data));

  await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  const badLogin = await request('POST', '/auth/login', { email: 'admin@test.com', password: 'wrong' }, false);
  check('invalid login is rejected', badLogin.status === 401);

  const login = await request('POST', '/auth/login', { email: 'admin@test.com', password: 'Admin@12345' }, false);
  check('admin login works', login.status === 200 && Boolean(login.data.data.token));
  token = login.data.data.token;

  const me = await request('GET', '/auth/me');
  check('authenticated /me works', me.status === 200 && me.data.data.user.role === 'admin');

  const unauth = await fetch(`${base}/books`);
  check('protected route rejects anonymous user', unauth.status === 401);

  const adminSelfRegister = await request(
    'POST',
    '/auth/register',
    { name: 'Sneaky User', email: 'sneaky@test.com', password: 'Member@123', role: 'admin' },
    false
  );
  check('self-registration cannot create admin', adminSelfRegister.status === 400);

  const registered = await request(
    'POST',
    '/auth/register',
    { name: 'Test Member', email: 'member@test.com', password: 'Member@123' },
    false
  );
  check('member self-registration works', registered.status === 201 && registered.data.data.user.role === 'member', JSON.stringify(registered.data));

  console.log('\n2. Categories & books');
  const category = await request('POST', '/categories', { name: 'Fiction', description: 'Novels' });
  check('category created', category.status === 201, JSON.stringify(category.data));
  const categoryId = category.data.data._id;

  const book = await request('POST', '/books', {
    title: 'Test Book',
    author: 'Test Author',
    category: categoryId,
    isbn: '9781234567890',
    totalCopies: 2,
    availableCopies: 2,
  });
  check('book created', book.status === 201, JSON.stringify(book.data));
  const bookId = book.data.data._id;

  const search = await request('GET', '/books?search=Test&availability=available&page=1&limit=10');
  check('book search and filter work', search.status === 200 && search.data.data.length === 1);

  const updated = await request('PUT', `/books/${bookId}`, {
    title: 'Test Book Updated',
    author: 'Test Author',
    category: categoryId,
    totalCopies: 3,
    availableCopies: 2,
  });
  check('book updated', updated.status === 200 && updated.data.data.title === 'Test Book Updated');

  // Regression: the edit form submits multipart/form-data when a cover is uploaded,
  // which turns every field (including tags) into a string.
  const coverForm = new FormData();
  coverForm.append('title', 'Test Book Updated');
  coverForm.append('author', 'Test Author');
  coverForm.append('category', categoryId);
  coverForm.append('totalCopies', '3');
  coverForm.append('availableCopies', '2');
  coverForm.append('tags', 'fiction, bestseller');
  coverForm.append('coverImage', new Blob([Buffer.from('fake image bytes')], { type: 'image/png' }), 'cover.png');

  const withCover = await request('PUT', `/books/${bookId}`, coverForm);
  check(
    'book update with cover image and comma-separated tags works',
    withCover.status === 200 &&
      withCover.data.data.coverImage?.startsWith('/uploads/') &&
      withCover.data.data.tags.length === 2,
    JSON.stringify(withCover.data)
  );

  const createForm = new FormData();
  createForm.append('title', 'Cover Upload Book');
  createForm.append('author', 'Test Author');
  createForm.append('category', categoryId);
  createForm.append('totalCopies', '1');
  createForm.append('tags', 'new, arrival');
  createForm.append('coverImage', new Blob([Buffer.from('fake image bytes')], { type: 'image/jpeg' }), 'cover.jpg');

  const createdWithCover = await request('POST', '/books', createForm);
  check(
    'book creation with cover image works',
    createdWithCover.status === 201 && createdWithCover.data.data.coverImage?.startsWith('/uploads/'),
    JSON.stringify(createdWithCover.data)
  );

  console.log('\n3. Members & borrowing');
  const member = await User.create({
    name: 'Borrower',
    email: 'borrower@test.com',
    password: 'Member@123',
    role: 'member',
  });

  const members = await request('GET', '/members');
  check('members list includes created member', members.status === 200 && members.data.meta.total >= 1);

  const issue = await request('POST', '/borrow/issue', { book: bookId, member: member._id });
  check('book issued', issue.status === 201, JSON.stringify(issue.data));
  const borrowId = issue.data.data._id;

  const afterIssue = await request('GET', `/books/${bookId}`);
  check('available copies decremented', afterIssue.data.data.availableCopies === 1);

  const duplicateIssue = await request('POST', '/borrow/issue', { book: bookId, member: member._id });
  check('same book can be issued again when copies remain', duplicateIssue.status === 201);

  const returnResult = await request('POST', '/borrow/return', { borrowId });
  check('book returned', returnResult.status === 200 && returnResult.data.data.status === 'returned');

  const fines = await request('GET', '/fines');
  check('fines endpoint works', fines.status === 200);

  const fine = await request('POST', '/fines', { member: member._id, amount: 12, reason: 'damage' });
  check('manual fine created', fine.status === 201);
  const paid = await request('PUT', `/fines/${fine.data.data._id}/pay`);
  check('fine payment recorded', paid.status === 200 && paid.data.data.status === 'paid');

  console.log('\n4. Reservations');
  const reserveBook = await request('POST', '/books', {
    title: 'Reserved Book',
    author: 'Author',
    category: categoryId,
    totalCopies: 1,
    availableCopies: 0,
  });
  const reserveBookId = reserveBook.data.data._id;

  const memberToken = registered.data.data.token;
  const savedToken = token;
  token = memberToken;
  const reservation = await request('POST', '/reservations', { book: reserveBookId });
  check('member can reserve unavailable book', reservation.status === 201, JSON.stringify(reservation.data));
  const reservationId = reservation.data.data._id;
  const duplicateReservation = await request('POST', '/reservations', { book: reserveBookId });
  check('duplicate reservation is blocked', duplicateReservation.status === 409);

  const myReservations = await request('GET', '/reservations');
  check('member sees only own reservations', myReservations.status === 200 && myReservations.data.data.every((r) => r.member._id === registered.data.data.user.id));

  token = savedToken;
  const notify = await request('PUT', `/reservations/${reservationId}`, { status: 'notified' });
  check('staff can notify reserving member', notify.status === 200 && notify.data.data.status === 'notified');

  console.log('\n5. Dashboard, reports, notifications & activity');
  const dashboard = await request('GET', '/dashboard');
  check('dashboard stats and analytics load', dashboard.status === 200 && dashboard.data.data.stats.totalBooks >= 3, JSON.stringify(dashboard.data.data?.stats));

  const report = await request('GET', '/reports/borrowing');
  check('borrowing report works', report.status === 200 && report.data.data.length >= 2);

  const csv = await request('GET', '/reports/borrowing?format=csv');
  check('CSV export works', csv.status === 200 && String(csv.data).includes('bookTitle'));

  const notifications = await request('GET', '/notifications');
  check('notifications endpoint works', notifications.status === 200 && Array.isArray(notifications.data.data));

  const activities = await request('GET', '/activities');
  check('activity log endpoint works', activities.status === 200 && activities.data.data.length > 0);

  console.log('\n6. Validation & authorization');
  const invalidBook = await request('POST', '/books', { title: '' });
  check('invalid book payload is rejected', invalidBook.status === 400);

  token = memberToken;
  const forbidden = await request('GET', '/dashboard');
  check('member cannot access admin dashboard', forbidden.status === 403);

  const deleteForbidden = await request('DELETE', `/books/${bookId}`);
  check('member cannot delete books', deleteForbidden.status === 403);

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
} catch (error) {
  console.error('Test run crashed:', error);
  failed += 1;
} finally {
  server.close();
  await disconnectDB();
  await memory.stop();
  process.exit(failed ? 1 : 0);
}
