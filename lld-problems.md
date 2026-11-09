<a id="top"></a>

<div align="center">

<sub>SYSTEM DESIGN · LOW-LEVEL DESIGN</sub>

# Classic LLD Problems

**Parking lot, elevator, vending machine, library, ATM — the object models interviewers expect, with runnable invariants.**

<sub>5 PROBLEMS · 5 STATE MODELS · 12 EXTENSION POINTS</sub>

</div>

> [!TIP]
> **The thesis** — an LLD answer is a set of **objects with one reason to change**, a **state machine with legal transitions**, and an **invariant that survives concurrency and retries**. The class list is the easy part; the interview is in the edges.

---

## On this page

<details open>
<summary><b>9 sections</b></summary>

1. [How to Answer a Classic LLD Question](#1-how-to-answer-a-classic-lld-question)
2. [Parking Lot](#2-parking-lot)
3. [Elevator System](#3-elevator-system)
4. [Vending Machine](#4-vending-machine)
5. [Library Management](#5-library-management)
6. [ATM](#6-atm)
7. [Coverage Map: The Rest of the Classic Set](#7-coverage-map-the-rest-of-the-classic-set)
8. [Hidden Tips & Tricks](#hidden-tips--tricks)
9. [Do's & Don'ts](#dos--donts)

</details>

---

## 1. How to Answer a Classic LLD Question

An LLD round is not a class-diagram contest. The interviewer is testing whether you can:

1. **Scope** the problem in two minutes (what is in, what is out).
2. **Find the nouns** that own state and the **verbs** that change it.
3. **Name the invariant** that must never be false.
4. **Choose the weakest pattern** that keeps it true.
5. **Walk the edges** — full, empty, duplicate, retry, cancel, concurrent access.

Use this sequence every time:

| Step | What you produce | Example (parking lot) |
| :--- | :--- | :--- |
| Scope | functional + non-functional + out-of-scope | assign a spot, issue a ticket, charge on exit; no reservations |
| Nouns | entities that own state | `ParkingLot`, `ParkingFloor`, `ParkingSpot`, `Ticket`, `Vehicle` |
| Verbs | operations that change state | `park`, `unpark`, `fee` |
| Invariant | the one sentence that must stay true | one active ticket per spot; a ticket closes once |
| Pattern | the weakest fit | Strategy for pricing, Factory for spot selection |
| Edges | failure cases | full lot, lost ticket, double unpark, payment failure |

**Patterns that pay for themselves in LLD:**

| Pattern | Use it when | Do not use it when |
| :--- | :--- | :--- |
| **Strategy** | pricing, allocation, ranking, retry policy varies | there is only one algorithm and no plan to add another |
| **State** | legal transitions are the point (idle → has money → dispensing) | the object has two booleans and no transition rules |
| **Factory** | creation needs selection logic (which spot type?) | `new` is already clear and stable |
| **Observer** | many consumers react to one event | one caller needs one answer |
| **Command** | undo/redo, queued operations, audit trail | operations are immediate and independent |
| **Chain of Responsibility** | a request passes through handlers (ATM notes, approvals) | every request hits every handler anyway |

**What separates a senior answer:** you say what you deliberately did **not** model. A parking lot without reservations is a smaller, correct design; an elevator without destination dispatch is a smaller, correct design. Name the cut.

---

## 2. Parking Lot

**Scope.** A lot has floors; each floor has spots of different types. A vehicle enters, gets the first compatible free spot, receives a ticket, and pays on exit. Reservations, valet, EV charging, and lost-ticket handling are out of scope unless the interviewer adds them.

**Core entities.**

| Entity | Owns | Key behavior |
| :--- | :--- | :--- |
| `ParkingLot` | floors, active tickets, pricing | `park(vehicle)`, `unpark(ticketId)` |
| `ParkingFloor` | an ordered list of spots | `findSpot(vehicle)` |
| `ParkingSpot` | id, type, current ticket | `canFit(vehicle)`, `occupy(ticket)`, `release()` |
| `Ticket` | id, vehicle, spot, entry/exit time | `close(now)` — exactly once |
| `PricingStrategy` | rate rules | `fee(ticket, now)` |

**Relationships.** `ParkingLot 1 ── * ParkingFloor 1 ── * ParkingSpot`; `Ticket * ── 1 ParkingSpot`; `Ticket * ── 1 Vehicle`.

**Key interfaces.**

```js
const VehicleType = Object.freeze({ MOTORCYCLE: 'motorcycle', CAR: 'car', TRUCK: 'truck' });
const fits = {
  motorcycle: ['motorcycle'],
  car: ['motorcycle', 'car'],
  truck: ['truck'],
};

class ParkingSpot {
  constructor(id, type) { this.id = id; this.type = type; this.ticket = null; }
  canFit(vehicle) { return this.ticket === null && fits[vehicle.type].includes(this.type); }
  occupy(ticket) {
    if (this.ticket) throw new Error('spot already occupied');
    this.ticket = ticket;
  }
  release() { this.ticket = null; }
}

class ParkingFloor {
  constructor(id, spots) { this.id = id; this.spots = spots; }
  findSpot(vehicle) { return this.spots.find(spot => spot.canFit(vehicle)) ?? null; }
}

class Ticket {
  constructor(id, vehicle, spot, entryAt) {
    this.id = id; this.vehicle = vehicle; this.spot = spot;
    this.entryAt = entryAt; this.exitAt = null;
  }
  close(now) {
    if (this.exitAt !== null) throw new Error('ticket already closed');
    this.exitAt = now;
  }
}

class HourlyPricing {
  constructor(ratePerHour) { this.ratePerHour = ratePerHour; }
  fee(ticket, now) {
    const end = ticket.exitAt ?? now;
    const hours = Math.max(1, Math.ceil((end - ticket.entryAt) / 3_600_000));
    return hours * this.ratePerHour;
  }
}

class ParkingLot {
  constructor(floors, pricing) {
    this.floors = floors; this.pricing = pricing;
    this.tickets = new Map(); this.sequence = 0;
  }
  park(vehicle, now = Date.now()) {
    for (const floor of this.floors) {
      const spot = floor.findSpot(vehicle);
      if (!spot) continue;
      const ticket = new Ticket(`T${++this.sequence}`, vehicle, spot, now);
      spot.occupy(ticket);
      this.tickets.set(ticket.id, ticket);
      return ticket;
    }
    return null;                                   // lot full
  }
  unpark(ticketId, now = Date.now()) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) throw new Error('unknown ticket');
    ticket.close(now);
    ticket.spot.release();
    this.tickets.delete(ticketId);
    return this.pricing.fee(ticket, now);
  }
}

// demo: one car for two hours at $5/hour
const lot = new ParkingLot(
  [new ParkingFloor('F1', [new ParkingSpot('A1', 'car'), new ParkingSpot('A2', 'truck')])],
  new HourlyPricing(5),
);
const ticket = lot.park({ id: 'KA-01-1234', type: 'car' }, 0);
console.log(ticket.id, lot.unpark(ticket.id, 2 * 3_600_000)); // T1 10
```

**Invariants.**

| Invariant | Why it matters | Test |
| :--- | :--- | :--- |
| A spot has at most one active ticket | double-booking is the classic bug | park the same spot twice |
| A ticket closes at most once | double-exit must not double-charge | call `unpark` twice |
| A vehicle only takes a compatible spot | oversized vehicles block aisles | park a truck in a car spot |
| Fee is computed from closed times | repricing after exit is fraud | close, wait, re-read fee |

**Extend it.** Add `Reservation` with a hold expiry; add `EVSpot` with a charger; replace `HourlyPricing` with a `PricingStrategy` that has weekend/EV tiers; add `EntryGate`/`ExitGate` as thin adapters around `park`/`unpark`. If the lot is distributed, the spot assignment needs a lease or a conditional update — the same fencing problem as [Distributed Locking](system-design-concepts.md#34-distributed-locking--fencing).

**What breaks.** Two entry gates assign the same spot concurrently (use a per-spot conditional write or a lease); a payment succeeds but the exit gate times out (make `unpark` idempotent by ticket id); a ticket is lost (price from entry time with a maximum daily cap).

**Sources.** [System Design Primer — parking lot](https://github.com/donnemartin/system-design-primer/tree/master/solutions/object_oriented_design/parking_lot) · [Strategy pattern](https://refactoring.guru/design-patterns/strategy) · [State pattern](https://refactoring.guru/design-patterns/state).

---

## 3. Elevator System

**Scope.** A building has N elevators and M floors. A request is a call from a floor (with a direction) plus a destination inside the car. The controller assigns calls, the car moves one floor per tick, and doors open at requested floors. Destination dispatch, maintenance mode, and fire service are follow-ups.

**Core entities.**

| Entity | Owns | Key behavior |
| :--- | :--- | :--- |
| `Elevator` | floor, direction, pending floors, capacity | `request(floor)`, `step()` |
| `ElevatorController` | the fleet | `request(from, to)` — assign the best car |
| `Direction` | up/down/idle | used by the SCAN policy |
| `ElevatorState` | moving/idle/doors-open/maintenance | legal transitions |

**Relationships.** `Controller 1 ── * Elevator`; `Elevator 1 ── * Request` (pending floors).

**Key interfaces.**

```js
const Direction = Object.freeze({ UP: 1, DOWN: -1, IDLE: 0 });

class Elevator {
  constructor(id, floors = 10, capacity = 8) {
    this.id = id; this.floors = floors; this.capacity = capacity;
    this.floor = 0; this.direction = Direction.IDLE;
    this.requests = new Set(); this.passengers = 0;
  }
  request(floor) {
    if (floor < 0 || floor >= this.floors) throw new Error('floor out of range');
    this.requests.add(floor);
  }
  step() {
    if (this.requests.size === 0) { this.direction = Direction.IDLE; return this.floor; }
    if (this.direction === Direction.IDLE) {
      const first = this.requests.values().next().value;
      this.direction = first > this.floor ? Direction.UP : Direction.DOWN;
    }
    let candidates = [...this.requests].filter(f =>
      this.direction === Direction.UP ? f >= this.floor : f <= this.floor);
    if (candidates.length === 0) {                 // nothing ahead: reverse
      this.direction *= -1;
      candidates = [...this.requests];
    }
    const target = this.direction === Direction.UP
      ? Math.min(...candidates) : Math.max(...candidates);
    this.floor += Math.sign(target - this.floor);
    if (this.requests.has(this.floor)) this.requests.delete(this.floor);
    return this.floor;
  }
}

class ElevatorController {
  constructor(elevators) { this.elevators = elevators; }
  request(from, to) {
    const car = [...this.elevators].sort((a, b) =>
      Math.abs(a.floor - from) - Math.abs(b.floor - from))[0];
    car.request(from); car.request(to);
    return car.id;
  }
}

const controller = new ElevatorController([new Elevator('E1'), new Elevator('E2')]);
controller.request(0, 5);
for (let i = 0; i < 5; i++) controller.elevators[0].step();
console.log(controller.elevators[0].floor); // 5
```

**Invariants.**

| Invariant | Why it matters | Test |
| :--- | :--- | :--- |
| The car moves one floor per tick | bounded latency and no teleporting | step from 0 to 5 |
| A request is served or remains pending | no lost calls | request 3, 7 while moving up |
| Direction reverses only when nothing is ahead | avoids thrashing | request 9 then 1 |
| Capacity is enforced at boarding | overload is a safety issue | board 9 into an 8-person car |

**Extend it.** Replace nearest-car with **SCAN/LOOK** (continue in direction, then reverse) or **destination dispatch** (group passengers by destination); add `DoorState` with a timeout; add `Maintenance` as a state that rejects requests; add priority calls for fire service. The state pattern keeps the door/motion transitions explicit.

**What breaks.** Two controllers assign the same car (single controller or a lease); a door sensor sticks (timeout → alarm, not infinite wait); a request is added while the car is at that floor (dedupe the set); a full car passes a call (remember it and serve on the next pass).

**Sources.** [System Design Primer — OOD prompts](https://github.com/donnemartin/system-design-primer#object-oriented-design-interview-questions-with-solutions) · [State pattern](https://refactoring.guru/design-patterns/state) · [Elevator algorithm (SCAN)](https://en.wikipedia.org/wiki/Elevator_algorithm).

---

## 4. Vending Machine

**Scope.** A machine holds products in slots. A user selects a product, inserts money, and receives the product plus change. Cancel/refund, out-of-stock, and insufficient funds are in scope; card payments, age checks, and remote telemetry are follow-ups.

**Core entities.**

| Entity | Owns | Key behavior |
| :--- | :--- | :--- |
| `VendingMachine` | state, balance, selected product | `select`, `insert`, `dispense`, `refund` |
| `Product` | code, price, stock | decrement exactly once |
| `Inventory` | code → product | `available(code)` |
| `State` | idle / has-money / dispensing | legal transitions |

**Relationships.** `VendingMachine 1 ── * Product`; `VendingMachine 1 ── 1 State`; `VendingMachine 1 ── 1 Balance`.

**Key interfaces.**

```js
const VendingState = Object.freeze({
  IDLE: 'idle', HAS_MONEY: 'has_money', DISPENSING: 'dispensing',
});

class VendingMachine {
  constructor(products) {
    this.products = new Map(products.map(p => [p.code, { ...p }]));
    this.state = VendingState.IDLE;
    this.selected = null; this.balance = 0;
  }
  select(code) {
    if (this.state !== VendingState.IDLE) throw new Error('busy');
    const product = this.products.get(code);
    if (!product || product.stock <= 0) throw new Error('out of stock');
    this.selected = product;
    this.state = VendingState.HAS_MONEY;
    return product.price;
  }
  insert(amount) {
    if (this.state !== VendingState.HAS_MONEY) throw new Error('select a product first');
    if (amount <= 0) throw new Error('invalid amount');
    this.balance += amount;
    return this.balance;
  }
  dispense() {
    if (this.state !== VendingState.HAS_MONEY) throw new Error('select a product first');
    if (this.balance < this.selected.price) throw new Error('insufficient funds');
    this.state = VendingState.DISPENSING;
    const code = this.selected.code;
    this.selected.stock -= 1;
    const change = this.balance - this.selected.price;
    this.balance = 0; this.selected = null;
    this.state = VendingState.IDLE;
    return { code, change };
  }
  refund() {
    if (this.state !== VendingState.HAS_MONEY) throw new Error('nothing to refund');
    const refund = this.balance;
    this.balance = 0; this.selected = null;
    this.state = VendingState.IDLE;
    return refund;
  }
}

const machine = new VendingMachine([{ code: 'A1', price: 150, stock: 2 }]);
console.log(machine.select('A1'));   // 150
console.log(machine.insert(200));     // 200
console.log(machine.dispense());      // { code: 'A1', change: 50 }
```

**Invariants.**

| Invariant | Why it matters | Test |
| :--- | :--- | :--- |
| Stock decrements exactly once per dispense | free product / phantom inventory | call `dispense` twice |
| Balance resets after dispense or refund | double-spend | dispense, then refund |
| State transitions are legal | dispensing before payment | call `dispense` from idle |
| Change is non-negative | pricing bug | insert exactly the price |

**Extend it.** Replace the boolean state with a `State` object per state (Idle, HasMoney, Dispensing, OutOfStock); add a `ChangeMaker` strategy (greedy for canonical coins, DP/backtracking for arbitrary denominations); add a `PaymentMethod` strategy for card/UPI; add `ExpiryDate` per slot. The state pattern makes “what is legal now?” one table instead of nested `if`s.

**What breaks.** The dispenser jams after the balance is cleared (keep a pending transaction and refund/retry); two users press buttons concurrently (one machine lock per transaction); the product is selected but never paid (reservation timeout releases it); the machine cannot make exact change (reject before accepting money).

**Sources.** [State pattern](https://refactoring.guru/design-patterns/state) · [System Design Primer — OOD prompts](https://github.com/donnemartin/system-design-primer#object-oriented-design-interview-questions-with-solutions) · [Coin change problem](https://en.wikipedia.org/wiki/Change-making_problem).

---

## 5. Library Management

**Scope.** Members search a catalog, borrow available copies, return them, and reserve a title when all copies are out. The system tracks due dates and fines. Acquisitions, e-books, and inter-library loans are out of scope.

**Core entities.**

| Entity | Owns | Key behavior |
| :--- | :--- | :--- |
| `Catalog` | ISBN → title, barcodes, waitlists | `search(query)`, `reserve(member, isbn)` |
| `BookItem` | barcode, status, current loan | `available`, `on_loan`, `lost` |
| `Member` | id, loan quota, active loans | `canBorrow()` |
| `Loan` | item, member, due date | `fine(now)` |
| `Library` | checkout/return orchestration | `checkout`, `returnItem` |

**Relationships.** `Catalog 1 ── * BookItem`; `Loan * ── 1 BookItem`; `Loan * ── 1 Member`; `Catalog 1 ── * Waitlist`.

**Key interfaces.**

```js
class BookItem {
  constructor(barcode, isbn, title) {
    this.barcode = barcode; this.isbn = isbn; this.title = title;
    this.status = 'available'; this.loan = null;
  }
}

class Loan {
  constructor(item, member, dueAt) {
    this.item = item; this.member = member; this.dueAt = dueAt;
  }
}

class Member {
  constructor(id, quota = 5) { this.id = id; this.quota = quota; this.loans = []; }
  canBorrow() { return this.loans.length < this.quota; }
}

class Catalog {
  constructor() { this.items = new Map(); this.waitlists = new Map(); }
  add(item) { this.items.set(item.barcode, item); }
  search(query) {
    const q = query.toLowerCase();
    return [...this.items.values()].filter(i =>
      i.title.toLowerCase().includes(q) && i.status === 'available');
  }
  reserve(member, isbn) {
    if (!this.waitlists.has(isbn)) this.waitlists.set(isbn, []);
    const queue = this.waitlists.get(isbn);
    if (!queue.includes(member)) queue.push(member);
    return queue.indexOf(member) + 1;
  }
}

class Library {
  constructor(catalog, finePerDay = 1) { this.catalog = catalog; this.finePerDay = finePerDay; }
  checkout(member, barcode, now = Date.now(), days = 14) {
    const item = this.catalog.items.get(barcode);
    if (!item || item.status !== 'available') throw new Error('copy not available');
    if (!member.canBorrow()) throw new Error('loan quota reached');
    item.status = 'on_loan';
    const loan = new Loan(item, member, now + days * 86_400_000);
    item.loan = loan; member.loans.push(loan);
    return loan;
  }
  returnItem(member, barcode, now = Date.now()) {
    const item = this.catalog.items.get(barcode);
    if (!item || item.status !== 'on_loan') throw new Error('copy is not on loan');
    const loan = item.loan;
    const lateDays = Math.max(0, Math.ceil((now - loan.dueAt) / 86_400_000));
    const fine = lateDays * this.finePerDay;
    item.status = 'available'; item.loan = null;
    member.loans = member.loans.filter(l => l !== loan);
    const next = this.catalog.waitlists.get(item.isbn)?.shift() ?? null;
    return { fine, lateDays, next: next?.id ?? null };
  }
}

const catalog = new Catalog();
catalog.add(new BookItem('BC-1', 'ISBN-1', 'Designing Data-Intensive Applications'));
const library = new Library(catalog);
const member = new Member('M1');
const loan = library.checkout(member, 'BC-1', 0);
console.log(loan.dueAt > 0, library.returnItem(member, 'BC-1', 15 * 86_400_000).fine); // true 1
```

**Invariants.**

| Invariant | Why it matters | Test |
| :--- | :--- | :--- |
| One copy has at most one active loan | two members cannot hold the same barcode | checkout twice |
| A member cannot exceed quota | fairness | checkout `quota + 1` |
| Return is idempotent | double-return must not double-fine | return twice |
| Waitlist is FIFO | no starvation | reserve A, B, C; return |

**Extend it.** Add `Reservation` with an expiry (a held copy that is not picked up returns to the shelf); add `Renewal` with a max count; add `FinePolicy` (flat/day, max cap, waivers); add `BookItem.status = 'lost'` with a replacement charge. Search can move to an inverted index when the catalog grows — see [Indexing](system-design-concepts.md#50-indexing-fundamentals--selection-strategy).

**What breaks.** Two branches share a catalog but not a loan table (partition by barcode, route checkout to the owning branch); a return arrives at a different branch (transfer state, don't mark available until it lands); a member is deleted with active loans (block deletion or transfer the loans); a reservation expires while the member is at the desk (grace window).

**Sources.** [System Design Primer — OOD prompts](https://github.com/donnemartin/system-design-primer#object-oriented-design-interview-questions-with-solutions) · [State pattern](https://refactoring.guru/design-patterns/state) · [Library circulation systems](https://en.wikipedia.org/wiki/Library_management_system).

---

## 6. ATM

**Scope.** A user inserts a card, authenticates with a PIN, withdraws cash, and gets a receipt. The machine must dispense the requested amount from available notes and debit the account exactly once. Deposits, transfers, and cardless withdrawal are follow-ups.

**Core entities.**

| Entity | Owns | Key behavior |
| :--- | :--- | :--- |
| `ATM` | session state, card, account | `insertCard`, `authenticate`, `withdraw` |
| `Account` | balance, PIN | `debit`, `credit` |
| `CashDispenser` | note counts | `plan(amount)`, `commit(plan)` |
| `Transaction` | id, amount, status | audit trail |

**Relationships.** `ATM 1 ── 1 Session`; `Session 1 ── 1 Account`; `ATM 1 ── 1 CashDispenser`.

**Key interfaces.**

```js
const AtmState = Object.freeze({
  IDLE: 'idle', CARD_INSERTED: 'card_inserted', AUTHENTICATED: 'authenticated',
});

class Account {
  constructor(id, pin, balance) { this.id = id; this.pin = pin; this.balance = balance; }
  debit(amount) {
    if (amount <= 0) throw new Error('invalid amount');
    if (this.balance < amount) throw new Error('insufficient funds');
    this.balance -= amount;
  }
  credit(amount) { this.balance += amount; }
}

class CashDispenser {
  constructor(notes) { this.notes = new Map(Object.entries(notes)); }
  plan(amount) {
    const plan = new Map();
    let left = amount;
    for (const denomination of [...this.notes.keys()].map(Number).sort((a, b) => b - a)) {
      const count = Math.min(this.notes.get(String(denomination)), Math.floor(left / denomination));
      if (count > 0) { plan.set(denomination, count); left -= count * denomination; }
    }
    if (left !== 0) throw new Error('cannot dispense this amount');
    return plan;
  }
  commit(plan) {
    for (const [denomination, count] of plan) {
      if (this.notes.get(String(denomination)) < count) throw new Error('insufficient cash');
    }
    for (const [denomination, count] of plan) {
      this.notes.set(String(denomination), this.notes.get(String(denomination)) - count);
    }
  }
}

class ATM {
  constructor(accounts, dispenser) {
    this.accounts = accounts; this.dispenser = dispenser;
    this.state = AtmState.IDLE; this.card = null; this.account = null;
  }
  insertCard(card) {
    if (this.state !== AtmState.IDLE) throw new Error('busy');
    this.card = card; this.state = AtmState.CARD_INSERTED;
  }
  authenticate(pin) {
    if (this.state !== AtmState.CARD_INSERTED) throw new Error('insert card first');
    const account = this.accounts.get(this.card.accountId);
    if (!account || account.pin !== pin) throw new Error('invalid PIN');
    this.account = account; this.state = AtmState.AUTHENTICATED;
  }
  withdraw(amount) {
    if (this.state !== AtmState.AUTHENTICATED) throw new Error('authenticate first');
    const plan = this.dispenser.plan(amount);      // validate before debit
    this.account.debit(amount);
    try {
      this.dispenser.commit(plan);
    } catch (error) {
      this.account.credit(amount);                 // compensate on dispenser failure
      throw error;
    }
    return { amount, notes: [...plan.entries()], balance: this.account.balance };
  }
  ejectCard() { this.state = AtmState.IDLE; this.card = null; this.account = null; }
}

const atm = new ATM(
  new Map([['A1', new Account('A1', '1234', 1_000)]]),
  new CashDispenser({ 500: 2, 200: 3, 100: 5 }),
);
atm.insertCard({ accountId: 'A1' });
atm.authenticate('1234');
console.log(atm.withdraw(700)); // { amount: 700, notes: [[500,1],[200,1]], balance: 300 }
```

**Invariants.**

| Invariant | Why it matters | Test |
| :--- | :--- | :--- |
| Debit and dispense are one logical transaction | no free cash, no lost debit | force `commit` to fail |
| Dispensed notes sum to the amount | short-changing | withdraw 700 |
| A session cannot withdraw before auth | card skimming / bypass | call `withdraw` from idle |
| PIN is never logged or stored in plaintext | security | inspect transaction log |

**Extend it.** Replace greedy note selection with **DP/backtracking** when the note set is non-canonical; add a `Transaction` table with `PENDING → COMMITTED/ROLLED_BACK`; add a `Receipt` observer; add a daily withdrawal limit per card; add a `CardReader` adapter for EMV. The chain-of-responsibility pattern fits note dispensing: each denomination handler takes what it can and passes the remainder.

**What breaks.** The dispenser jams after debit (compensating credit, mark the transaction failed); the network times out after the debit but before the response (idempotency key + transaction lookup); two withdrawals race on one balance (row lock / conditional update); the ATM is out of cash for the requested mix (reject before debit, suggest a nearby amount).

**Sources.** [System Design Primer — OOD prompts](https://github.com/donnemartin/system-design-primer#object-oriented-design-interview-questions-with-solutions) · [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) · [Two-phase commit vs saga](system-design-concepts.md#24-two-phase-commit-2pc-vs-saga).

---

## 7. Coverage Map: The Rest of the Classic Set

The five designs above cover the state-heavy prompts. These are the other prompts that show up in LLD rounds, and where the mechanics already live:

| Prompt | Core idea | Where to go |
| :--- | :--- | :--- |
| Call center | employees by role, call queue, escalation | Chain of Responsibility + [Notification system](system-design-notification-system.md) |
| Deck of cards / blackjack | deck, shoe, hand, dealer policy | Strategy + State; model cards as immutable values |
| Chat server | rooms, membership, message fan-out | [Messaging app](system-design-messaging-app.md) · [Discord](system-design-discord.md) |
| Circular array / ring buffer | head/tail, overwrite vs block | [Concurrent ring buffer](low-level-design.md#10-concurrent-ring-buffer) |
| Hash map / LRU | buckets, eviction, thread safety | [LLD §2–§3](low-level-design.md#2-thread-safe-lru-cache) |
| Snake & Ladder | board, dice, snakes, turn order | State + Strategy; no persistence needed |
| Splitwise | users, groups, expenses, settle-up | Graph + greedy debt simplification |
| Hotel / movie booking | inventory holds, seat locks, expiry | [Ticketing](system-design-ticketing-system.md) · [Airbnb](system-design-airbnb.md) |
| Ride-hailing | driver matching, trip state | [Uber](system-design-uber.md) |
| Food delivery | order state, restaurant/menu, dispatch | [Food delivery](system-design-food-delivery.md) |
| Meeting scheduler | calendars, recurrence, free/busy | [Google Calendar](system-design-google-calendar.md) |
| Chess | board, piece movement, check/checkmate | Command (undo) + Strategy (AI); validate king safety after every move |

**How to use the map:** if the prompt is state-heavy (parking, elevator, vending, ATM), copy the scope → entities → invariants → state table sequence. If it is data-heavy (Splitwise, booking), start from the invariants and the storage model, then add classes. Do not force every prompt into the same diagram.

---

## Hidden Tips & Tricks

- **Start with the invariant, not the class list.** "One active ticket per spot" is the design; the classes are how you enforce it.
- **Use composition before inheritance.** `PricingStrategy`, `AssignmentStrategy`, and `PaymentMethod` are interfaces, not base classes with a deep hierarchy.
- **Make the state machine explicit.** A table of `from → event → to` catches illegal transitions faster than nested `if`s.
- **Say what is out of scope.** A parking lot without reservations is a complete answer; adding reservations without being asked invites holes.
- **Put the concurrency edge in the answer.** "Two gates assign the same spot" is the senior follow-up; a lease or conditional write is the answer.
- **Name the pattern only after the design.** "This is Strategy" is a summary, not a substitute for the invariant.

---

## Do's & Don'ts

| ✅ Do | ❌ Don't |
| :-- | :-- |
| Write the scope and the invariant before any class | Start with a 20-class inheritance tree |
| Use a table for entities, invariants, and states | Draw a fragile ASCII class diagram |
| Model money and inventory as explicit state | Use floating-point for currency |
| Make exit/return/withdraw idempotent | Assume the caller retries exactly once |
| Name the concurrency and failure edges | Pretend a single-process model is the production answer |
| Link the follow-up to the existing design doc | Duplicate a whole HLD inside the LLD answer |

---

<nav>← [Low-Level Design](low-level-design.md) · [Concepts](system-design-concepts.md) · [README](README.md) →</nav>

---

<p align="right"><a href="#top">↑ Back to top</a></p>
