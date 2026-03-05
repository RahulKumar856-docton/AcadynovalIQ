import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "acadynova-secret-key-2026";
const db = new Database("acadynova.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    reg_no TEXT,
    dept TEXT,
    year TEXT,
    sem TEXT
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    faculty_id INTEGER NOT NULL,
    dept TEXT,
    year TEXT,
    sem TEXT,
    questions TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (faculty_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    time_taken INTEGER DEFAULT 0, -- in seconds
    accuracy REAL DEFAULT 0, -- percentage
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password, role, reg_no, dept, year, sem } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const result = db.prepare(
        "INSERT INTO users (name, email, password, role, reg_no, dept, year, sem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(name, email, hashedPassword, role, reg_no, dept, year, sem);
      
      const user = { id: result.lastInsertRowid, name, email, role, reg_no, dept, year, sem };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.json({ token, user: userWithoutPassword });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Quiz Routes
  app.get("/api/quizzes", authenticateToken, (req: any, res) => {
    let quizzes;
    if (req.user.role === 'faculty') {
      quizzes = db.prepare(`
        SELECT q.*, COUNT(s.id) as submissions, AVG(s.score) as avgScore 
        FROM quizzes q 
        LEFT JOIN submissions s ON q.id = s.quiz_id 
        WHERE q.faculty_id = ? 
        GROUP BY q.id
      `).all(req.user.id);
    } else {
      quizzes = db.prepare(`
        SELECT q.*, (SELECT score FROM submissions WHERE quiz_id = q.id AND student_id = ?) as myScore
        FROM quizzes q 
        WHERE q.dept = ? AND q.year = ? AND q.sem = ?
      `).all(req.user.id, req.user.dept, req.user.year, req.user.sem);
    }
    const quizzesWithQuestions = quizzes.map((q: any) => ({
      ...q,
      questions: q.questions ? JSON.parse(q.questions) : []
    }));
    res.json(quizzesWithQuestions);
  });

  app.post("/api/quizzes", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'faculty') return res.sendStatus(403);
    const { title, dept, year, sem, questions } = req.body;
    const result = db.prepare(
      "INSERT INTO quizzes (title, faculty_id, dept, year, sem, questions) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(title, req.user.id, dept, year, sem, JSON.stringify(questions || []));
    
    const newQuiz = { id: result.lastInsertRowid, title, dept, year, sem, questions, submissions: 0, avgScore: 0 };
    io.emit("quiz:created", newQuiz);
    res.json(newQuiz);
  });

  app.post("/api/quizzes/:id/submit", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'student') return res.sendStatus(403);
    const { score, timeTaken, accuracy } = req.body;
    const quizId = req.params.id;
    
    db.prepare(
      "INSERT INTO submissions (quiz_id, student_id, score, time_taken, accuracy) VALUES (?, ?, ?, ?, ?)"
    ).run(quizId, req.user.id, score, timeTaken || 0, accuracy || 0);

    const stats = db.prepare(`
      SELECT COUNT(id) as submissions, AVG(score) as avgScore 
      FROM submissions WHERE quiz_id = ?
    `).get(quizId);

    io.emit("quiz:submitted", { quizId, ...stats });
    res.json({ success: true, score });
  });

  app.get("/api/quizzes/:id/submissions", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'faculty') return res.sendStatus(403);
    const submissions = db.prepare(`
      SELECT s.*, u.name as student_name, u.reg_no as student_reg_no
      FROM submissions s 
      JOIN users u ON s.student_id = u.id 
      WHERE s.quiz_id = ?
      ORDER BY s.submitted_at ASC
    `).all(req.params.id);
    res.json(submissions);
  });

  app.get("/api/stats/student", authenticateToken, (req: any, res) => {
    const stats = db.prepare(`
      SELECT COUNT(id) as totalQuizzes, AVG(score) as avgScore 
      FROM submissions WHERE student_id = ?
    `).get(req.user.id);
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
