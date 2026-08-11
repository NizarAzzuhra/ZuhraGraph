# ZUHRA GRAPH — AI PROJECT HANDOVER DOCUMENT

## 1. Project Overview

**Project:** ZuhraGraph  
**Type:** Web-based graphic design commission platform  
**Main focus:** Commissioning graphic design work, not general art commissions, merchandise, or physical products.

Primary roles:
- `BUYER` — customer who purchases a commission.
- `ADMIN` — seller/artist/operator who manages commissions.

Technology stack:
- Next.js 16.3.0
- React 19.2.8
- TypeScript
- Prisma 7.9.1
- PostgreSQL
- `@prisma/adapter-pg`
- `pg`
- Midtrans Client
- NextAuth
- Zod
- bcrypt
- Cloudinary
- Tailwind CSS 4

---

## 2. Critical Business Decisions

### Escrow

Escrow is **not required** for this project.

Do not reintroduce escrow unless the project owner explicitly changes the requirement.

### Automatic 24-hour completion

Do **not** implement automatic completion after 24 hours.

Completion must happen through the intended explicit workflow.

### Graphic-design focus

The commission workflow is designed primarily around graphic design. Revision rules should distinguish artist corrections from buyer-requested changes and genuine scope changes.

---

## 3. Order and Brief

Every order contains a `brief`.

The brief is the buyer's requirements/instructions for the commission.

The intended future brief-edit system is:

Buyer can request a brief change -> seller/artist/admin reviews it -> request is approved or rejected -> the decision includes a reason/description.

The buyer should not be able to silently overwrite an important brief after the commission has progressed.

The final brief-edit schema has **not yet been finalized** in the current Prisma schema.

Therefore, do not invent a final schema without auditing the PRD and repository first.

---

## 4. Revision Business Rules

The revision system should distinguish three concepts:

### CORRECTION

The artist caused an error relative to the agreed requirements.

Examples:
- Artist typo.
- Incorrect spelling introduced by the artist.
- Missing item that was explicitly required.
- Wrong agreed color.
- Other artist-side mistake.

A correction should not unfairly consume the buyer's paid/additional revision allowance.

### REVISION

A buyer-requested change that remains within the agreed commission scope and revision allowance.

Examples:
- Typography adjustment.
- Reasonable color adjustment.
- Layout adjustment within scope.

### SCOPE_CHANGE

A request that goes beyond the original agreement.

Examples:
- New deliverables.
- Additional pages/assets.
- Completely different design direction.
- Work outside the purchased package.

Scope changes may legitimately require additional fees.

### Fairness rule

The system should protect both parties.

The artist/admin may classify a request as correction, revision, or scope change, but the classification must not become an unchecked mechanism for charging buyers.

The system should preserve:
- requester
- description
- classification
- decision
- reason
- fee
- revision usage
- related artwork version
- timestamps

The exact final database design for this workflow is still pending.

---

## 5. Current Prisma Database

Current models:

```text
User
Portfolio
Package
Order
Payment
RevisionRequest
ArtworkVersion
Notification
ActivityDiscussion
Review
Queue
FAQ
OrderStatusHistory
AuditLog
```

Current enums:

```text
Role
OrderStatus
PaymentStatus
NotificationType
ItemStatus
RevisionStatus
NotificationStatus
```

Current `OrderStatus`:

```text
PENDING
AWAITING_PAYMENT
PAID
CONFIRMED
PROCESSING
ARTWORK_UPLOADED
WAITING_BUYER_CONFIRMATION
REVISION_REQUESTED
PROCESSING_REVISION
COMPLETED
CANCELLED
```

Important relationships:

```text
User -> Orders
User -> Notifications
User -> Discussions
User -> Reviews
User -> AuditLogs

Package -> Orders

Order -> Buyer
Order -> Package
Order -> Payments
Order -> RevisionRequests
Order -> ArtworkVersions
Order -> Discussions
Order -> StatusHistories
Order -> Review

Payment -> Order
RevisionRequest -> Order
ArtworkVersion -> Order
Notification -> User
ActivityDiscussion -> Order + User
Review -> Order + User
OrderStatusHistory -> Order
AuditLog -> optional User
```

### Important database gaps

The current schema has no dedicated `BriefEditRequest` model.

The current `RevisionRequest` model is not yet explicit about:
- correction
- normal revision
- scope change

Therefore those features are **not fully implemented** merely because `RevisionRequest` exists.

---

## 6. Current Order Domain Entity

The latest `Order.ts` contains the complete basic lifecycle:

```text
PENDING
 -> AWAITING_PAYMENT
 -> PAID
 -> CONFIRMED
 -> PROCESSING
 -> ARTWORK_UPLOADED
 -> WAITING_BUYER_CONFIRMATION
 -> COMPLETED
```

Revision path:

```text
WAITING_BUYER_CONFIRMATION
 -> REVISION_REQUESTED
 -> PROCESSING_REVISION
 -> ARTWORK_UPLOADED
 -> WAITING_BUYER_CONFIRMATION
```

Cancellation is supported.

The entity methods currently include:

```text
submit()
markAsPaid()
confirm()
startProcessing()
uploadArtwork()
requestBuyerConfirmation()
requestRevision()
startRevision()
complete()
cancel()
```

### Assessment

`Order.ts` is substantially complete for the current basic order lifecycle.

Do not automatically put brief-edit or revision-classification behavior into `Order.ts`. Those may belong in separate domain entities/use cases.

---

## 7. Current Order Repository

```ts
import { Order } from '../entities/Order';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
  findAllByBuyerId(buyerId: string): Promise<Order[]>;
}
```

The repository is an abstraction and should remain separate from Prisma.

---

## 8. Current Order Service

The intended current `OrderService.ts` contains:

- `createOrder()`
- `handlePaymentSuccess()`
- `confirmOrder()`
- `startProcessing()`
- `requestBuyerConfirmation()`
- `completeOrder()`
- `cancelOrder()`

Architecture:

```text
OrderService
  -> OrderRepository
  -> PaymentGateway
  -> NotificationService
```

The service should orchestrate use cases and delegate state-transition validation to the `Order` domain entity.

It should not directly instantiate Prisma.

### Known limitation: payment transaction

`handlePaymentSuccess(orderId, transactionId)` receives `transactionId`, but the current `OrderRepository` only persists an `Order`.

This does **not** mean the database cannot store it. The existing `Payment` model already has:

```prisma
transactionId String?
token String?
```

A proper payment repository/use case should eventually persist the transaction.

Do not add transaction data to `Order` merely to work around this.

### Known limitation: amount validation

`createOrder()` currently accepts:

```ts
amount: number
```

The backend should not trust a client-provided price.

Preferred flow:

```text
packageId
 -> PackageRepository
 -> authoritative Package.price
 -> Order.totalAmount
 -> Midtrans gross_amount
```

A package repository or equivalent lookup abstraction may be required.

---

## 9. Payment Gateway

Current interface:

```ts
export interface PaymentInitiationResult {
  token: string;
  redirectUrl: string;
}

export interface PaymentGateway {
  initiatePayment(
    orderId: string,
    amount: number,
    buyerInfo: any
  ): Promise<PaymentInitiationResult>;

  verifyWebhookSignature(
    payload: any,
    signature: string
  ): boolean;

  getPaymentStatus(
    transactionId: string
  ): Promise<string>;
}
```

The gateway abstraction keeps Midtrans-specific logic out of the domain.

---

## 10. Midtrans Implementation

A current implementation exists using `midtrans-client` and Snap.

It:
- initializes Snap
- creates transactions
- returns token and redirect URL
- verifies webhook signature using SHA-512
- queries transaction status

Before production, audit:
- environment variables
- no fake fallback credentials in production
- webhook signature handling
- webhook idempotency
- transaction persistence
- payment status mapping
- server-side amount validation

---

## 11. Prisma 7 Issue Already Encountered

The original repository used:

```ts
const prisma = new PrismaClient();
```

This caused:

```text
PrismaClientInitializationError:
PrismaClient was instantiated without any options.
A driver adapter is required to connect to your database.
```

The project uses:

```json
"@prisma/adapter-pg": "^7.9.1",
"pg": "^8.22.0"
```

The project owner fixed this using Antigravity.

### Important

Never revert the working Prisma 7 adapter configuration.

Before editing Prisma infrastructure, inspect the actual current Prisma client/adapter file and reuse it.

---

## 12. Build Status

After the Prisma initialization issue was fixed, the project reached a successful Next.js build.

Relevant output included:

```text
✓ Compiled successfully
✓ Finished TypeScript
```

Routes included:

```text
/api/auth/[...nextauth]
/api/orders
```

There was a warning that Next.js ignored:

```text
C:\Users\user\package-lock.json
```

because it is outside the project repository.

That warning is not the same as a build failure and should not trigger unrelated application changes.

---

## 13. Architecture

The intended backend architecture is:

```text
API / Route
    ↓
Application Service / Use Case
    ↓
Domain Entity / Business Rules
    ↓
Repository Interfaces
    ↓
Infrastructure Repositories
    ↓
Prisma / PostgreSQL
```

External services:

```text
Application Service
    ↓
Gateway Interface
    ↓
Midtrans / Cloudinary / Notification implementation
```

Responsibilities:

### Domain Entity
Business rules and state transitions.

### Application Service
Use-case orchestration.

### Repository Interface
Persistence abstraction.

### Infrastructure Repository
Prisma/database implementation.

### Gateway
External service integration.

---

## 14. PRD → Database → Backend Snapshot

| Requirement | Database | Backend | Status |
|---|---|---|---|
| Buyer account | User | Auth foundation | Foundation |
| Admin role | User.role | Auth foundation | Foundation |
| Portfolio | Portfolio | Not fully audited | Foundation |
| Packages | Package | Package repository not confirmed | Foundation |
| Order | Order | Order + OrderService | Foundation implemented |
| Brief | Order.brief | Order creation supports it | Basic implemented |
| Controlled brief editing | No dedicated table | Not confirmed | **Missing** |
| Payment | Payment | Midtrans gateway | Partial |
| Payment transaction persistence | Payment supports transactionId | Proper persistence not confirmed | **Incomplete** |
| Order confirmation | OrderStatus | confirmOrder | Foundation |
| Processing | OrderStatus | startProcessing | Foundation |
| Artwork upload | ArtworkVersion | Order method | Partial |
| Buyer confirmation | OrderStatus | Service method | Foundation |
| Revision request | RevisionRequest | Basic flow | Partial |
| Correction/revision/scope change | No explicit type | Not complete | **Missing** |
| Fair revision charging | Not fully modeled | Not complete | **Missing** |
| Notifications | Notification | Notification interface | Partial |
| Discussions | ActivityDiscussion | Not fully audited | Foundation |
| Reviews | Review | Not fully audited | Foundation |
| Queue | Queue | Not fully audited | Foundation |
| FAQ | FAQ | Not fully audited | Foundation |
| Status history | OrderStatusHistory | Not fully confirmed | Partial |
| Audit logs | AuditLog | Not fully confirmed | Partial |
| Escrow | None | None | **Intentionally excluded** |
| 24h auto-complete | None | None | **Intentionally excluded** |

---

## 15. Recommended Development Order

### Phase 1 — Verify baseline

Run:

```bash
npm run build
npx prisma generate
npx prisma validate
```

Use migration/db push only after understanding database implications.

### Phase 2 — Audit Prisma adapter

Confirm:
- adapter creation
- DATABASE_URL
- Prisma client initialization
- no duplicate Prisma clients
- correct server-only boundary

### Phase 3 — Payment persistence

Implement a proper payment repository/use case.

Target flow:

```text
Midtrans webhook
 -> verify signature
 -> find payment/order
 -> update Payment
 -> transition Order
 -> persist
 -> notify
```

Make webhook handling idempotent.

### Phase 4 — Server-side package pricing

Do not trust frontend `amount`.

Use `packageId` to obtain the authoritative package price.

### Phase 5 — Brief edit request

Design:

```text
Buyer
  ↓
Brief Edit Request
  ↓
Artist/Admin
  ├─ APPROVE -> update agreed brief
  └─ REJECT  -> save reason
```

Preserve history where appropriate.

### Phase 6 — Revision classification

Implement:

```text
CORRECTION
REVISION
SCOPE_CHANGE
```

Record reason and financial/revision consequences.

### Phase 7 — Authorization

Audit every order endpoint for:
- role
- ownership
- allowed status
- allowed actor

### Phase 8 — Notifications, history, audit logs

Ensure important events are recorded.

### Phase 9 — Tests

At minimum test:
- valid order lifecycle
- invalid transitions
- cancellation
- payment success/failure
- duplicate webhook
- incorrect payment amount
- unauthorized access
- brief edit approval/rejection
- correction
- revision
- scope change
- additional fee
- completion
- review restrictions

---

## 16. Important Areas / Files

Exact paths should be confirmed against the actual repository, but these areas have been discussed:

```text
schema.prisma
src/.../domain/entities/Order.ts
src/.../domain/interfaces/OrderRepository.ts
src/.../domain/interfaces/PaymentGateway.ts
src/.../application/services/OrderService.ts
src/.../infrastructure/repositories/PrismaOrderRepository.ts
src/.../infrastructure/.../MidtransPaymentGateway.ts
app/api/orders/...
```

---

## 17. Rules for the Next AI

Do NOT:

1. Reintroduce escrow.
2. Implement 24-hour auto-completion.
3. Delete existing database models merely to simplify code.
4. Replace Prisma/PostgreSQL without explicit instruction.
5. Revert Prisma 7 adapter configuration.
6. Trust frontend package prices.
7. Silently discard payment transaction IDs in the final implementation.
8. Add arbitrary schema fields without checking requirements.
9. Change the order state machine without auditing consumers.
10. Put every business rule into `Order.ts`.
11. Charge the buyer for an artist-caused correction.
12. Treat every buyer request as a scope change.
13. Perform destructive database changes without explicit justification.
14. Refactor unrelated files to fix a local error.

---

## 18. Recommended AI Workflow

Before changing code:

1. Inspect actual repository files.
2. Compare implementation against this document.
3. Classify each relevant item:
   - Implemented
   - Partially implemented
   - Missing
   - Potential bug
   - Requires PRD decision
4. Explain the required changes.
5. Identify database implications.
6. Make the smallest safe change.
7. Run build/type/Prisma validation.
8. Report changed files and remaining blockers.

If the actual repository conflicts with this handover, do not silently choose one. Report the discrepancy.

If the PRD conflicts with this handover, treat the PRD as the business source of truth, but explicitly report the conflict.

If a requirement is ambiguous, ask for a decision instead of inventing a business rule.

---

# 19. COPY-PASTE HANDOVER PROMPT

You are taking over the ZuhraGraph project.

Read the entire handover document before making any changes.

Do not blindly rewrite existing code.

First inspect the actual repository and compare it with the handover.

For every relevant feature, classify it as:

1. IMPLEMENTED
2. PARTIALLY IMPLEMENTED
3. MISSING
4. POTENTIAL BUG
5. REQUIRES PRD DECISION

Critical rules:

- No escrow.
- No automatic 24-hour completion.
- Keep PostgreSQL and Prisma.
- Preserve the Prisma 7 driver-adapter configuration.
- Never trust client-provided package pricing.
- Do not silently discard payment transaction data.
- Artist-caused corrections must not unfairly consume buyer revision allowance.
- Do not classify every buyer change as a paid scope change.
- Do not modify schema.prisma unless the requirement genuinely requires it.
- Do not make unrelated refactors.
- Preserve domain/application/infrastructure separation.

Before editing a file, explain:
- current problem
- affected requirement
- files that need changes
- whether database changes are required
- whether migration is required
- possible impact on existing APIs

After implementation:
1. Run build/type validation.
2. Run Prisma validation/generation where appropriate.
3. Report files changed.
4. Report remaining blockers.
5. Do not claim completion merely because the project compiles.

Development priority:

1. Verify Prisma configuration.
2. Verify Order/OrderService integration.
3. Complete payment persistence and webhook handling.
4. Stop trusting frontend package price.
5. Design/implement controlled brief editing.
6. Design/implement fair correction/revision/scope-change workflow.
7. Audit authorization.
8. Complete notifications/status history/audit logging.
9. Test the full commission lifecycle.

The objective is a reliable, fair, auditable graphic-design commission platform for both buyers and artists/admins.
