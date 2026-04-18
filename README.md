# Web RAG Pipeline

A two-app project with:

- `client`: Next.js chat UI
- `agent`: Express + LangChain backend that routes between direct answers and web-based answers

The UI sends a question to the backend, and the backend decides whether to answer directly or use web search + page summarization before composing a final response.

## Project Structure

```text
search/
  agent/   # API + pipeline logic
  client/  # Next.js frontend
```

## How It Works

1. User submits a question in the client.
2. Client calls `POST /search` on the agent.
3. Agent validates input with Zod.
4. Agent route strategy chooses:
   - `direct`: answer from model directly
   - `web`: web search -> open URLs -> summarize -> compose final answer
5. Agent returns:
   - `answer: string`
   - `sources: string[]`
6. Client renders answer, latency, and source links.

## Tech Stack

### Client
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Agent
- Node.js + Express
- TypeScript
- LangChain
- Zod validation
- Tavily web search
- Model providers: Gemini / Groq / OpenAI

## Prerequisites

- Node.js 18+
- pnpm

## Environment Variables

### 1) Agent env file

Create `agent/.env`:

```env
PORT=5174
ALLOWED_ORIGIN=http://localhost:3000

MODEL_PROVIDER=gemini

GOOGLE_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_key

OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.0-flash-lite
GROQ_MODEL=llama-3.1-8b-instant
SEARCH_PROVIDER=tavily
```

### 2) Client env file

Create `client/.env`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5174
```

## Install Dependencies

From each app folder:

```bash
cd agent
pnpm install

cd ../client
pnpm install
```

## Run Locally

Start both apps in separate terminals.

### Terminal 1: agent

```bash
cd agent
pnpm run dev
```

### Terminal 2: client

```bash
cd client
pnpm run dev
```

Then open:

- Client: http://localhost:3000
- Agent API: http://localhost:5174


