# Smart Library REST API

Base URL: `http://localhost:5000/api`

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

Responses are wrapped in `{ success, message?, data?, meta?, summary? }`. Pagination metadata contains `page`, `limit`, `total`, `totalPages`, `hasNext`, `hasPrev`.

**Roles:** `admin` (full access), `librarian` (operations, no waive fines), `member` (self-service).

---

## Authentication

| Method | Endpoint | Role | Body / Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | `{ name, email, password, phone?, studentId?, address? }`. Role is always `member`; `librarian` can be requested but `admin` is rejected. Returns `{ user, token }`. |
| POST | `/auth/login` | public | `{ email, password }` → `{ user, token }` |
| POST | `/auth/forgot-password` | public | `{ email }`. Sends SMTP email when configured; otherwise returns `data.resetToken` in development. |
| POST | `/auth/reset-password` | public | `{ token, password }` → `{ token }` |
| GET | `/auth/me` | any | Current user profile |
| PUT | `/auth/profile` | any | `{ name?, phone?, address?, avatar? }` |
| PUT | `/auth/password` | any | `{ currentPassword, newPassword }` |

## Books

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/books` | any | Query: `page`, `limit`, `search`, `category`, `availability=available\|unavailable`, `author`, `minYear`, `maxYear`, `sort=title,-createdAt,…` |
| GET | `/books/featured` | any | Up to 8 available books |
| GET | `/books/:id` | any | Book + category + active borrow count + reservation queue |
| POST | `/books` | admin, librarian | JSON or multipart with `coverImage`. Fields: `title, author, category, isbn?, description?, publisher?, publicationYear?, totalCopies?, availableCopies?, shelfLocation?, tags?, language?` |
| PUT | `/books/:id` | admin, librarian | Partial update supported; optional `coverImage` file replaces the old cover |
| DELETE | `/books/:id` | admin, librarian | Blocked if active loans exist; cancels active reservations |

## Categories

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/categories` | any | Includes `bookCount` and `availableCount` |
| POST | `/categories` | admin, librarian | `{ name, description?, color?, icon? }` |
| PUT | `/categories/:id` | admin, librarian | Partial update |
| DELETE | `/categories/:id` | admin, librarian | Blocked if books use the category |

## Members

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/members` | admin, librarian | Query: `page`, `limit`, `search`, `status`, `role=member\|librarian\|staff\|all` |
| GET | `/members/:id` | admin, librarian | Profile + issued + history + fines + reservations + outstanding fine |
| POST | `/members` | admin, librarian | `{ name, email, password?, phone?, studentId?, address?, role?, membershipStatus? }`. Returns `temporaryPassword` when omitted. |
| PUT | `/members/:id` | admin, librarian | Partial update of allowed fields |
| DELETE | `/members/:id` | admin, librarian | Blocked when active loans or unpaid fines exist |
| GET | `/members/:memberId/history` | admin, librarian | Paginated borrow history |

## Borrowing

| Method | Endpoint | Role | Body / Notes |
| --- | --- | --- | --- |
| POST | `/borrow/issue` | admin, librarian | `{ book, member, dueDate?, notes? }` → populated borrow |
| POST | `/borrow/return` | admin, librarian | `{ borrowId, condition?, notes? }` → return + fine + next-reservation notification |
| GET | `/borrow` | admin, librarian | Query: `page`, `limit`, `status=issued\|returned\|overdue\|all`, `member`, `book`, `from`, `to`, `sort` |
| GET | `/borrow/me` | any | Current member's loans; `?status=issued\|returned` |
| GET | `/borrow/member/:memberId` | admin, librarian | Another member's loans |
| GET | `/borrow/overdue` | admin, librarian | All currently overdue loans |
| PUT | `/borrow/renew/:id` | admin, librarian | Extends due date 14 days; max 2 renewals; blocked by reservations |

## Reservations

| Method | Endpoint | Role | Body / Notes |
| --- | --- | --- | --- |
| POST | `/reservations` | any | `{ book, notes? }`. Only unavailable books; duplicate/queue limits enforced. |
| GET | `/reservations` | any | Members see only their own. Query: `page`, `limit`, `status`, `book`, `member` (staff). Response includes `queuePosition`. |
| PUT | `/reservations/:id` | admin, librarian | `{ status: pending\|notified\|fulfilled\|cancelled\|expired, notes? }` |
| DELETE | `/reservations/:id` | any | Members may cancel only their own active reservations |
| POST | `/reservations/expire` | admin, librarian | Expires `notified` reservations older than 48 hours |

## Fines

| Method | Endpoint | Role | Body / Notes |
| --- | --- | --- | --- |
| GET | `/fines` | any | Members see only their own. Query: `page`, `limit`, `status`, `member` (staff), `reason`. Returns `summary` totals. |
| POST | `/fines` | admin, librarian | `{ member, amount, reason=overdue\|damage\|lost\|other, description?, borrow? }` |
| PUT | `/fines/:id/pay` | admin, librarian | `{ paymentMethod? }` → status `paid`, marks linked borrow `finePaid` |
| PUT | `/fines/:id/waive` | admin | Marks a fine waived |

## Dashboard

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/dashboard/stats` | admin, librarian | Headline statistics |
| GET | `/dashboard/analytics` | admin, librarian | 12-month trend, most borrowed, availability, recent loans/members/activity |
| GET | `/dashboard` | admin, librarian | `{ stats, analytics }` combined |

## Reports

All report endpoints accept `?format=csv` to download a UTF-8 CSV file; otherwise JSON with `data` and `meta.count`.

| Method | Endpoint | Role | Query |
| --- | --- | --- | --- |
| GET | `/reports/borrowing` | admin, librarian | `from`, `to`, `status`, `format` |
| GET | `/reports/overdue` | admin, librarian | `format` |
| GET | `/reports/fines` | admin, librarian | `status`, `from`, `to`, `format` |
| GET | `/reports/books` | admin, librarian | `format` |
| GET | `/reports/members` | admin, librarian | `format` |
| GET | `/reports/popular-books` | admin, librarian | `format` |

## Notifications & activity

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/notifications` | any | Query `page`, `limit`, `read=true\|false`; returns `unreadCount` |
| PUT | `/notifications/:id/read` | any | Mark one notification read |
| PUT | `/notifications/read-all` | any | Mark all read |
| DELETE | `/notifications/:id` | any | Remove own notification |
| GET | `/activities` | admin, librarian | Audit log; query `page`, `limit`, `action`, `actor` |

## System

| Method | Endpoint | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | public | Service health and uptime |

---

## Status codes

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Resource created |
| 400 | Validation failure / invalid input |
| 401 | Missing, invalid or expired token |
| 403 | Insufficient role permissions or inactive account |
| 404 | Resource or route not found |
| 409 | Conflict (duplicate value, unavailable book, protected record) |
| 429 | Rate limit exceeded on auth routes |
| 500 | Unexpected server error |

---

## Example: issue → return → fine

```bash
TOKEN="<admin token>"

curl -X POST http://localhost:5000/api/borrow/issue \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"book":"<bookId>","member":"<memberId>"}'

curl -X POST http://localhost:5000/api/borrow/return \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"borrowId":"<borrowId>","condition":"good"}'

curl -X GET "http://localhost:5000/api/reports/fines?format=csv" \
  -H "Authorization: Bearer $TOKEN" -o fines.csv
```
