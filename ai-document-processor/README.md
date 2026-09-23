# DocuLens - AI-Powered Intelligent Document Processing Platform

A full-stack MERN (TypeScript) app where users upload documents (PDF, image, text), and the system
**reads them (text extraction + OCR), summarises them with an AI API, and pulls out key details**
such as emails, phone numbers, dates and amounts. Users can then search, filter, edit and track the
processing status of every document.

## Features

- Register / login with JWT authentication (passwords hashed with bcrypt)
- Upload PDF, PNG, JPG and TXT files (drag and drop, 10 MB limit)
- Automatic processing in the background: `queued -> processing -> completed / failed`
- Text extraction: PDF text (`pdf-parse`), image OCR (`tesseract.js`), plain text
- AI summary + document type, key points, people and organizations (Gemini or Claude API)
- Works **without any API key** too: falls back to a simple built-in summariser
- Regex extraction of emails, phone numbers, dates and amounts
- Dashboard with live status counts (auto-refreshes while documents are processing)
- Documents page: search, filter by status / type, sort, pagination
- Document page: edit title, summary, tags, notes; download original; process again; delete
- Responsive UI (works on mobile), error handling on both frontend and backend
- API tests (Jest + Supertest) and a Postman collection

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19, TypeScript, Vite, React Router, Axios, plain CSS |
| Backend  | Node.js, Express 4, TypeScript, Mongoose |
| Database | MongoDB (local or Atlas) |
| Auth     | JWT + bcryptjs |
| Files    | Multer (uploads), pdf-parse, tesseract.js (OCR) |
| AI       | Google Gemini API or Anthropic Claude API (optional) |
| Testing  | Jest, ts-jest, Supertest, Postman collection |

## Folder structure

```
ai-document-processor/
├── server/
│   ├── src/
│   │   ├── config/        env + database connection
│   │   ├── models/        User, Document (Mongoose schemas)
│   │   ├── middleware/    auth (JWT), upload (multer), errorHandler
│   │   ├── controllers/   authController, documentController
│   │   ├── routes/        authRoutes, documentRoutes
│   │   ├── services/      textExtractor (PDF/OCR), aiService, processService (pipeline)
│   │   ├── utils/         extractInfo (regex helpers), AppError, asyncHandler
│   │   ├── app.ts         express app (used by tests too)
│   │   └── server.ts      starts DB + server
│   ├── tests/             Jest tests
│   ├── postman/           Postman collection
│   └── uploads/           uploaded files are stored here
└── client/
    └── src/
        ├── api/           axios instance (adds the JWT token)
        ├── context/       AuthContext
        ├── components/    Navbar, ProtectedRoute, UploadForm, DocumentList, StatusBadge
        └── pages/         Login, Register, Dashboard, Documents, DocumentDetail
```

## Getting started

### 1. Requirements

- Node.js 18 or newer
- MongoDB - either installed locally, or a free cluster on MongoDB Atlas

### 2. Backend

```bash
cd server
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Open `server/.env` and set at least:

```
MONGO_URI=mongodb://127.0.0.1:27017/idp     # or your Atlas connection string
JWT_SECRET=some_long_random_string
```

Then start it:

```bash
npm run dev               # http://localhost:5000
```

### 3. Frontend (new terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, create an account and upload a document.
(Vite forwards `/api` calls to the backend on port 5000, so no extra setup is needed.)

### 4. Turn on the AI summary (optional)

By default `AI_PROVIDER=none`, so summaries come from a simple built-in summariser.
For real AI summaries, pick one in `server/.env` and restart the server:

```
# Option A - Gemini (free tier): get a key at https://aistudio.google.com/apikey
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# Option B - Claude: get a key at https://console.anthropic.com
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
```

Model names are in `.env` (`GEMINI_MODEL`, `ANTHROPIC_MODEL`). Model names change over time, so if the API
returns a "model not found" error, check the provider's docs and update the value. When an AI call fails, the
document is still completed using the built-in summariser (check the server console for the error).

> Never commit your `.env` file or API keys to GitHub. `.gitignore` already excludes it.

## How processing works

1. `POST /api/documents` saves the file, creates a Document with status `uploaded`, and returns immediately.
2. `processDocument()` runs in the background: status `processing` -> extract text -> regex extraction ->
   AI analysis -> save results -> status `completed` (or `failed` with an error message).
3. The frontend polls every few seconds while a document is queued or processing, so the badge updates by itself.

## API endpoints

All `/api/documents` routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, returns token |
| POST | `/api/auth/login` | Login, returns token |
| GET | `/api/auth/me` | Current user |
| POST | `/api/documents` | Upload (`multipart/form-data`: `file`, optional `title`) |
| GET | `/api/documents` | List. Query: `search`, `status`, `fileType`, `sort`, `page`, `limit` |
| GET | `/api/documents/stats` | Counts by status |
| GET | `/api/documents/:id` | One document with extracted text |
| GET | `/api/documents/:id/file` | Download the original file |
| PUT | `/api/documents/:id` | Edit `title`, `summary`, `tags`, `notes` |
| POST | `/api/documents/:id/reprocess` | Run processing again |
| DELETE | `/api/documents/:id` | Delete document and file |
| GET | `/api/health` | Health check |

## Testing

```bash
cd server
npm test
```

- `tests/extractInfo.test.ts` - unit tests for the email / date / amount / summary helpers
- `tests/api.test.ts` - Supertest checks for validation, 404 and 401 handling (no database needed)

For the full flow (register -> upload -> search -> edit -> delete) import
`server/postman/idp-api.postman_collection.json` into Postman and run the requests in order.
In the "Upload document" request, pick a file in the `file` field of the Body tab first.
The Register / Login requests save the token automatically.

## Known limitations (good "future improvements" list)

- Scanned PDFs (PDFs that are only images) have no text layer, so they fail with a clear message.
  Upload a screenshot / photo of the page as PNG or JPG instead, or add PDF-to-image conversion.
- OCR needs internet the first time (it downloads English language data). For offline use, put
  `eng.traineddata` in a folder and set `TESSERACT_LANG_PATH` in `.env`.
- Processing runs inside the API process. For production, move it to a job queue (BullMQ + Redis).
- Files are stored on the server disk; production would use S3 or similar.
- Only English OCR. No email verification / password reset.

## Scripts

| Where | Command | What it does |
|-------|---------|--------------|
| server | `npm run dev` | Start API with auto-reload |
| server | `npm run build` / `npm start` | Compile TypeScript and run the compiled build |
| server | `npm test` | Run Jest tests |
| client | `npm run dev` | Start Vite dev server |
| client | `npm run build` | Type-check and create the production build |
