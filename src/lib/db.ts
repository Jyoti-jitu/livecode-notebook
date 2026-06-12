import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lovestudy';

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then(m => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

const CellSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['code', 'markdown'], required: true },
  language: { type: String, default: 'python' },
  content: { type: String, default: '' },
  output: { type: mongoose.Schema.Types.Mixed, default: '' },
  executionCount: { type: Number, default: 0 }
});

const NotebookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  icon: { type: String, default: '❤️' },
  language: { type: String, default: 'python_notebook' },
  cells: [CellSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ChatMessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const SharedNotesSchema = new mongoose.Schema({
  notesContent: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const PresenceSchema = new mongoose.Schema({
  username: { type: String, required: true },
  roomId: { type: String, required: true },
  lastActive: { type: Date, default: Date.now }
});

const RoomStateSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  streakDays: { type: Number, default: 0 },
  streakHearts: { type: Number, default: 0 },
  streakGoalProgress: { type: Number, default: 0 },
  studyTimeElapsed: { type: Number, default: 0 },
  heartReactionCount: { type: Number, default: 0 },
  currentMood: { type: String, default: '😊 Focused' },
  updatedAt: { type: Date, default: Date.now }
});

const ActivitySchema = new mongoose.Schema({
  id: { type: String, required: true },
  user: { type: String, required: true },
  action: { type: String, required: true },
  notebook: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const Notebook = mongoose.models.Notebook || mongoose.model('Notebook', NotebookSchema);
export const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
export const SharedNotes = mongoose.models.SharedNotes || mongoose.model('SharedNotes', SharedNotesSchema);
export const Presence = mongoose.models.Presence || mongoose.model('Presence', PresenceSchema);
export const RoomState = mongoose.models.RoomState || mongoose.model('RoomState', RoomStateSchema);
export const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
