# 💕 LiveCode Notebook

A **real-time collaborative live code notebook** built with Next.js, Monaco Editor, and Yjs — designed for pair programming and study sessions.

## ✨ Features

- 🧑‍💻 **Monaco Editor** — VS Code-quality editor in the browser (Python, JS, C++, Java, Go)
- 🤝 **Real-time Collaboration** — Yjs-powered live cursors and multi-user sync
- 📓 **Jupyter-style Notebooks** — Multi-cell Python notebooks with rich output
- 📊 **DataFrame Tables** — Pandas DataFrames rendered as interactive tables
- 📋 **Copy Output** — One-click copy button for cell output text
- 💾 **MongoDB Persistence** — Notebooks, cells, and chat saved to database
- 💬 **Study Room Chat** — Real-time chat panel for collaborators
- 🍅 **Pomodoro Timer** — Built-in focus timer with streak tracking
- 🌙 **Dark / Light Mode** — Smooth theme toggle
- 📱 **Responsive Layout** — Mobile-friendly with drawer panels

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Editor | Monaco Editor + @monaco-editor/react |
| Real-time | Yjs + y-websocket + y-monaco |
| State | Zustand |
| Database | MongoDB via Mongoose |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |

## 🔧 Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017/livecode
```

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # REST API endpoints
│   └── notebook/     # Room-based notebook pages
├── components/       # React UI components
├── hooks/            # Custom React hooks
├── lib/              # Database, Yjs, Pyodide utilities
└── store/            # Zustand global state store
```
