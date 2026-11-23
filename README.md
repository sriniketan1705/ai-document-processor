DocuLens - AI-Powered Intelligent Document Processing Platform 

A full-stack MERN (TypeScript) app where users upload documents (PDF, image, text), and the system reads them (text extraction + OCR), summarises them with an AI API, and pulls out key details such as emails, phone numbers, dates and amounts. Users can then search, filter, edit and track the processing status of every document.

Features

Register / login with JWT authentication (passwords hashed with bcrypt)
Upload PDF, PNG, JPG and TXT files (drag and drop, 10 MB limit)
Automatic processing in the background: queued -> processing -> completed / failed
Text extraction: PDF text (pdf-parse), image OCR (tesseract.js), plain text
AI summary + document type, key points, people and organizations (Gemini or Claude API)
Works without any API key too: falls back to a simple built-in summariser
Regex extraction of emails, phone numbers, dates and amounts
Dashboard with live status counts (auto-refreshes while documents are processing)
Documents page: search, filter by status / type, sort, pagination
Document page: edit title, summary, tags, notes; download original; process again; delete
Responsive UI (works on mobile), error handling on both frontend and backend
API tests (Jest + Supertest) and a Postman collection
