# LiveCode Notebook — Real-Time Collaborative Code Editor 🚀

LiveCode Notebook (also known as LoveStudy) is a premium real-time collaborative coding workspace and interactive notebook. It supports dynamic cell execution for Python (via browser-side Pyodide) and compiles/runs system languages like Java, C, and C++ through secure backend compiler environments.

## 🛠️ Features

*   **Real-time Multi-user Synchronization**: Powered by Yjs, y-monaco, and WebSocket signaling.
*   **Interactive Python Notebook Cells**: Powered by browser-side Pyodide execution.
*   **System Languages Compiler**: Backend execution pipeline supporting Java, C, and C++.
*   **Collaborative Chat, Notes, & AI Helper**: Live room chat, persistent shared markdown notes, and a built-in AI assistant powered by Google's Gemini 2.5 Flash.
*   **Streaks & Study Time Dashboard**: Track your shared learning targets and streaks.

---

## ⚙️ Local Development Setup

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and add your MongoDB database URI:
```bash
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/lovestudy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚡ Deployment on Vercel

### Step 1: Push Code to GitHub
Ensure your repository is fully up-to-date:
```bash
git add -A
git commit -m "prep: ready for Vercel deployment"
git push origin main
```

### Step 2: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **New Project** and import the `Jyoti-jitu/livecode-notebook` repository.
3. Keep the default Build and Output settings (Next.js preset).

### Step 3: Configure Environment Variables in Vercel
Under the **Environment Variables** section in the Vercel project settings, add the following keys:
*   `MONGODB_URI`: Your production MongoDB connection string (e.g., MongoDB Atlas).
*   `GEMINI_API_KEY`: Your Google Gemini API key (obtain from Google AI Studio).

### Step 4: Click Deploy 🚀
Vercel will build, optimize, and deploy your serverless endpoints and frontend automatically.
