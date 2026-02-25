# ClaimsPulse Prototype

ClaimsPulse is a hackathon MVP for payment recovery intelligence.

## Quick Start

```bash
cd /Users/shree/Desktop/SnapReund/claimspulse
npm install
npm run dev
```

## Optional Environment Variables

Create `.env` in project root:

```bash
VITE_DATA_MODE=mock
VITE_OPENAI_API_KEY=
VITE_SNAPREFUND_BASE_URL=
VITE_SNAPREFUND_TOKEN=
```

- `VITE_DATA_MODE=mock` is recommended for demo reliability.
- OpenAI enhancement only runs when `VITE_OPENAI_API_KEY` is set.
- Live adapter mode requires SnapRefund base URL and token.

## Test

```bash
npm run test
```
