# ClaimsPulse — AI-Powered Payment Recovery & Intelligence Engine

## The Pitch (30 seconds)

> "Pending payments can sit indefinitely until cashed out. Industry data says half of digital payment links never convert. That's a massive revenue leak for every SnapRefund customer. ClaimsPulse is a payment intelligence engine that detects stale and failed payments, uses AI to triage them by risk, and helps claims teams recover money before it falls through the cracks."

---

## 1-Minute Intro (For the Group Session)

> "Hey, I'm Shree. I'm a CS master's student at Viterbi, and I currently work as a software engineer at an insurance startup where I built an AI chatbot that autonomously handles 30% of user queries on a platform that grew to 30,000 users in under 3 months. When I looked at SnapRefund's API docs, I noticed something interesting — pending payments can sit indefinitely until cashed out. Industry data says about half of digital payment links never get converted. That's a massive revenue leak. So tonight I'm building ClaimsPulse — a payment intelligence engine that uses AI to detect stale and failed payments and help claims teams recover them before money falls through the cracks."

---

## The Problem (Why This Matters to SnapRefund)

### Problem 1: The Cash-Out Conversion Crisis

- **Fiserv case study**: Only ~50% of recipients cash out when sent digital payment links
- **VPay/Engine Insights survey**: 60% of consumers still receive claim payments by paper check despite digital options
- **SnapRefund's own docs confirm it**: "A recipient's pending payment will remain available until it is settled by the receiver, or canceled by the sender. There is no limit to when you are able to retrieve your money."
- Every uncashed pending payment = bad insured experience + liability on the insurer's books + lost revenue for SnapRefund

### Problem 2: Failed Payment Recovery

- ACH failures happen regularly — bad account numbers, closed accounts, insufficient funds
- A "Failed" payment means a real person who just had a house fire or car accident is NOT getting paid
- At scale (hundreds of claims), failed payments slip through cracks without proactive monitoring
- Manual detection and retry workflows are slow and error-prone

### Problem 3: Zero Visibility Into Payment Health

- Claims teams have no aggregate view of how their payments are performing
- No way to answer: "How many payments are stuck right now?" or "What's our average time to cash-out?"
- Without analytics, carriers can't optimize their payment operations
- Finance teams spend up to 10 days per month-end close on manual reconciliation

### The Business Impact

- Up to **$34 billion** in annual insurance premiums at risk due to poor claims experiences (One Inc / J.P. Morgan)
- **50% of satisfied claimants** renew their policy vs only **33% of dissatisfied** ones
- **42% of consumers** would switch carriers to get real-time claim payments
- Insurance fraud costs **$308.6 billion/year** — faster, tracked digital payments reduce fraud surface

---

## The Solution: ClaimsPulse

A real-time intelligence dashboard that monitors every payment's lifecycle and **proactively intervenes** when payments stall or fail. Think "mission control" for claim payments.

### Core Features

#### 1. Payment Health Dashboard
- Real-time overview: Active payments, stale payments (>24h no cash-out), failed payments, total $ at risk
- Visual payment lifecycle tracker showing state transitions
- Cash-out rate analytics over time
- Per-bank-account performance (which funding source has the most failures?)

#### 2. AI-Powered Triage & Priority Queue
- Automatically ranks payments by risk score = (amount × hours_stale × failure_probability)
- High-value stale payments bubble to the top
- Each payment gets an AI-generated suggestion for what to do next:
  - Stale 24h, low amount → "Auto-remind in 24h, low priority"
  - Stale 72h, high amount → "Insured may not trust email. Recommend carrier call insured directly"
  - Failed (R03 - No Account) → "Bank info was wrong. Send new pending payment link so insured can re-enter"
  - Failed (R01 - Insufficient Funds) → "Sender's bank didn't have enough. Check funding source balance"

#### 3. One-Click Recovery Actions
- **Resend Link**: Creates a new pending payment (POST /api/payment) when old one is stale
- **Switch Bank**: Fetches available funding sources (GET /funding-sources) and lets adjuster pick a different sender bank
- **Cancel & Retry**: Cancel the failed payment and send a fresh one
- **Generate SMS/Email**: AI drafts a personalized follow-up message to the insured

#### 4. AI Chat Assistant (The Ollie Parallel)
- Natural language interface for claims adjusters:
  - "Which payments need attention right now?"
  - "Why did payment 42 fail?"
  - "Send $2,000 to john@gmail.com for claim CLM-98765"
  - "What's our cash-out rate this week?"
  - "Show me all failed payments from the last 7 days"

---

## How It Uses All 3 SnapRefund APIs

| API Endpoint | How ClaimsPulse Uses It |
|---|---|
| **GET /api/dwolla/funding-sources/system** | On load: fetches all bank accounts. Shows which accounts have the most failed payments. Powers "Switch Bank" recovery action. Populates bank selector when sending new payments. |
| **POST /api/payment** | "Resend" button creates a new pending payment when old one is stale/failed. AI pre-fills memo with claim context. Also used by chatbot for "send payment to X" commands. |
| **GET /api/payment?paymentId=...** | Polls all active payments to track state changes. Detects stale payments (Awaiting >24h), newly failed payments, and completion events. Feeds the analytics engine. |

### API Flow Diagram

```
                    ClaimsPulse Architecture
                    
    ┌─────────────────────────────────────────────┐
    │           ClaimsPulse Frontend (React)        │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
    │  │Dashboard │ │Priority  │ │AI Chat       │ │
    │  │& Charts  │ │Queue     │ │Assistant     │ │
    │  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
    │       │             │              │          │
    │       ▼             ▼              ▼          │
    │  ┌─────────────────────────────────────────┐ │
    │  │         Payment State Manager            │ │
    │  │  - Polls payments every 10s              │ │
    │  │  - Calculates risk scores                │ │
    │  │  - Detects state transitions             │ │
    │  │  - Triggers AI triage on changes         │ │
    │  └──────┬──────────┬──────────┬─────────────┘ │
    └─────────┼──────────┼──────────┼───────────────┘
              │          │          │
              ▼          ▼          ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │GET       │  │POST      │  │GET       │
    │/funding- │  │/payment  │  │/payment  │
    │sources   │  │          │  │?id=...   │
    │          │  │(send/    │  │(poll     │
    │(list     │  │ resend)  │  │ status)  │
    │ banks)   │  │          │  │          │
    └──────────┘  └──────────┘  └──────────┘
         │              │             │
         ▼              ▼             ▼
    ┌─────────────────────────────────────┐
    │     SnapRefund / Dwolla / Plaid      │
    └─────────────────────────────────────┘
```

---

## Payment State Machine & Risk Logic

### Payment States (from SnapRefund docs)

```
Awaiting-cash-out  →  Lock  →  In-transit  →  Completed ✅
                                    ↓
                                  Failed ❌
         ↓
      Cancelled 🚫
```

### Risk Scoring Algorithm

```
risk_score = amount × time_factor × status_weight

Where:
  time_factor:
    < 12 hours  = 1.0 (normal)
    12-24 hours = 1.5 (watch)
    24-48 hours = 2.5 (warning)
    48-72 hours = 4.0 (critical)
    > 72 hours  = 6.0 (urgent)

  status_weight:
    Awaiting-cash-out = 1.0
    Failed            = 5.0  (immediate action needed)
    In-transit        = 0.2  (low concern, money moving)
    Lock              = 0.5  (processing, monitor)

Example:
  $52,000 × 4.0 (72hrs stale) × 1.0 (awaiting) = 208,000 → TOP PRIORITY
  $800 × 2.5 (30hrs stale) × 1.0 (awaiting) = 2,000 → Low priority
  $2,100 × 1.0 (just failed) × 5.0 (failed) = 10,500 → High priority
```

### ACH Return Code Reference (for AI explanations)

| Code | Meaning | AI Suggestion |
|---|---|---|
| R01 | Insufficient funds | Sender's bank didn't have enough. Check funding source or retry later. |
| R02 | Account closed | Insured's bank account is closed. Send new pending link to re-enter bank info. |
| R03 | No account / unable to locate | Bank info was wrong. Resend as pending payment so insured re-enters details. |
| R04 | Invalid account number | Typo in account number. Send new pending link. |
| R08 | Payment stopped | Insured stopped the payment. Contact them to understand why. |
| R10 | Customer advises not authorized | Insured claims they didn't authorize. Verify identity and resend. |
| R29 | Corporate customer advises not authorized | Corporate policy — need different authorization. Contact insured's company. |

---

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  🏥 ClaimsPulse — Payment Intelligence Engine          [Refresh] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   47     │  │   12     │  │    3     │  │   $284,200   │    │
│  │ Active   │  │ ⚠️ Stale  │  │ ❌ Failed │  │  💰 At Risk   │    │
│  │ Payments │  │ (>24hrs) │  │          │  │              │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│                                                                  │
│  ┌─ PRIORITY ACTIONS ──────────────────┐  ┌─ AI ASSISTANT ────┐ │
│  │                                     │  │                    │ │
│  │  🔴 CLM-4521  $52,000   72hrs stale │  │  "3 payments are  │ │
│  │     Awaiting-cash-out               │  │   stale >48hrs    │ │
│  │     💡 High-value, insured hasn't   │  │   totaling $84K.  │ │
│  │     opened email. Recommend carrier │  │   The $52K claim  │ │
│  │     call insured directly.          │  │   is highest      │ │
│  │     [Resend Link] [Generate SMS]    │  │   priority — it's │ │
│  │                                     │  │   a homeowner     │ │
│  │  🔴 CLM-9087  $2,100   FAILED      │  │   claim and the   │ │
│  │     ACH Return: R03 (No Account)    │  │   insured hasn't  │ │
│  │     💡 Bank info was wrong. Send    │  │   opened the      │ │
│  │     new pending link so insured     │  │   email yet."     │ │
│  │     re-enters bank details.         │  │                    │ │
│  │     [Resend as Pending] [Cancel]    │  │  ┌──────────────┐ │ │
│  │                                     │  │  │ Ask me...    │ │ │
│  │  🟡 CLM-6634  $800     48hrs stale  │  │  └──────────────┘ │ │
│  │     Awaiting-cash-out               │  │                    │ │
│  │     💡 Standard timing. Auto-remind │  │  Suggested:        │ │
│  │     in 24h.                         │  │  • Failed payments │ │
│  │     [Auto-Remind] [Resend Link]     │  │  • Cash-out rate   │ │
│  │                                     │  │  • Send payment    │ │
│  └─────────────────────────────────────┘  └────────────────────┘ │
│                                                                  │
│  ┌─ ANALYTICS ─────────────────────────────────────────────────┐ │
│  │  Cash-Out Rate: 67% (+5% this week)                         │ │
│  │  Avg Time to Cash-Out: 18.4 hours                           │ │
│  │  Failed Payment Rate: 4.2%                                  │ │
│  │  [$] By Bank: Chase ****4521 (92% success) |                │ │
│  │              BofA ****8890 (78% success) ⚠️                  │ │
│  │  [Chart showing payment completion funnel over time]        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Why |
|---|---|---|
| Frontend | React + Tailwind CSS | Fast to build, clean UI |
| Charts | Recharts | Simple React charting |
| AI Chat | OpenAI GPT-4o-mini or Claude API | Intent parsing + natural language responses |
| API Calls | Fetch / Axios | Call SnapRefund's 3 endpoints |
| State | React useState + useEffect polling | Real-time payment monitoring |
| Mock Data | JSON fixtures | If no live API credentials provided |

---

## Implementation Plan (2-Hour Hackathon)

### Phase 1: Foundation (30 min)
- [ ] Set up React app with Tailwind
- [ ] Create mock data for payments in all states (Awaiting, Failed, Completed, In-transit)
- [ ] Create mock funding sources data
- [ ] Build the 4 KPI cards (Active, Stale, Failed, $ At Risk)

### Phase 2: Priority Queue (30 min)
- [ ] Implement risk scoring algorithm
- [ ] Build the priority action list with payment cards
- [ ] Add status badges and time-stale calculations
- [ ] Add action buttons (Resend, Cancel, Generate SMS)

### Phase 3: AI Assistant (30 min)
- [ ] Build chat interface component
- [ ] Implement intent parsing (send payment, check status, get analytics)
- [ ] Wire up AI to generate triage suggestions for each stale/failed payment
- [ ] Add "ask me anything" with suggested prompts

### Phase 4: Polish & Analytics (30 min)
- [ ] Add analytics section with cash-out rate chart
- [ ] Add per-bank performance breakdown
- [ ] Connect real API endpoints (if credentials available) or keep mocks
- [ ] Final UI polish, add loading states, error handling

---

## Demo Script (For Presenting)

### Opening (30 seconds)
"This is ClaimsPulse — a payment intelligence engine for SnapRefund. Right now, when a claims team sends 50 pending payments, there's no way to know which ones are stuck, which failed, or where the money is. ClaimsPulse changes that."

### Dashboard Walkthrough (60 seconds)
"Here you can see at a glance: 47 active payments, 12 stale for more than 24 hours, 3 failed — and $284K in revenue at risk. The priority queue ranks these by a risk score that considers the dollar amount and how long it's been sitting."

### AI Triage Demo (60 seconds)
"Look at this $52K payment — it's been in Awaiting-cash-out for 72 hours. The AI flags this as critical and suggests the carrier call the insured directly, because a $52K homeowner claim recipient who hasn't opened the email likely doesn't trust it. Below that, we have a failed ACH with return code R03 — the AI knows that means 'no account found' and suggests resending as a new pending payment so the insured can re-enter their bank details."

### Chat Demo (60 seconds)
"And if I ask the assistant: 'Why did payment 42 fail?' — it fetches the status, sees it's an R03 return, and explains in plain English what happened and what to do. I can also say 'Send $2,000 to john@gmail.com for claim CLM-98765' and it orchestrates the API calls — fetching the right bank account and sending the payment."

### Closing (30 seconds)
"Industry data shows only about half of digital payment links get converted. ClaimsPulse is designed to close that gap by making every stale and failed payment visible, actionable, and recoverable. For a platform like SnapRefund, improving cash-out rate by even 10% could mean millions in additional payment volume for your customers."

---

## Why This Wins

| Factor | How ClaimsPulse Delivers |
|---|---|
| **Solves a real problem** | Cash-out conversion is SnapRefund's #1 revenue driver. Every recovered payment = revenue. |
| **Uses all 3 APIs** | Funding sources (bank selection), POST payment (resend/retry), GET payment (monitoring/polling). |
| **Shows product thinking** | Not just displaying data — taking action on it. Triage, prioritization, recovery workflows. |
| **AI is a superpower, not a gimmick** | The AI explains failures in plain English, generates suggestions, and can orchestrate API calls via natural language. |
| **Directly parallels Shree's experience** | Built Ollie (AI chatbot, 30% autonomous) on Pond (insurance platform, 30K users). This is literally the same pattern applied to SnapRefund. |
| **Nobody else will build this** | 77 students will build dashboards. This is a revenue recovery intelligence platform. Different league. |
| **Backed by real data** | Every claim in the pitch is sourced: Fiserv (50% cash-out), One Inc ($34B at risk), VPay (60% still on checks). |

---

## Smart Questions to Ask (If Time Permits)

1. **The Trust Question** (shows deep API understanding):
   > "When you send a pending payment, the insured gets an email with a link to connect their bank and cash out. But honestly — if I got a random email saying 'click here to get $2,000 and link your bank account,' my first thought would be that it's a scam. How do you guys handle that? Does the insurer give the person a heads-up first, or is it the branding on the page that builds trust?"

2. **The Conversion Question** (shows business thinking):
   > "What's the typical cash-out rate when insurers use pending payments vs direct payments? I imagine there's a trade-off between giving the insured choice and just depositing directly."

3. **The Scale Question** (shows startup awareness):
   > "You're at about 24 clients now — as you scale to hundreds, how are you thinking about multi-tenant payment monitoring? Like, do carriers have visibility into their own payment health metrics?"

---

## Industry Data Points (For Conversation)

- Insurance fraud: **$308.6 billion/year** in US losses (Coalition Against Insurance Fraud)
- **10% of all P&C claims** are fraudulent
- **25-30%** of claims now involve GenAI-altered fake documents
- Paper checks cost **10x more** than digital alternatives to process
- **42% of consumers** would switch carriers for real-time payments
- **50% of satisfied claimants** renew vs **33% of dissatisfied** (claims experience is the "moment of truth")
- **60% of consumers** have changed digital payment behavior due to scam concerns
- Manual reconciliation takes **up to 10 days** per month-end close
- Insurers redesigning claims around AI see **35% productivity boost** (Bain & Co)
- Only **27% of insurers** are pursuing comprehensive claims transformation