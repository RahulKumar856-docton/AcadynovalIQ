export type UserRole = 'student' | 'faculty' | 'guest';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  reg_no?: string;
  dept?: string;
  year?: string;
  sem?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  title: string;
  dept: string;
  year: string;
  sem: string;
  submissions: number;
  avgScore: number;
  createdAt: string;
  myScore?: number;
  questions?: Question[];
  status?: 'draft' | 'live' | 'ended';
}

export interface Submission {
  id: string;
  quizId: string;
  studentId: number;
  studentName: string;
  score: number;
  timeTaken: number; // in seconds
  accuracy: number; // percentage
  createdAt: string;
}

export interface StudentStats {
  totalQuizzes: number;
  avgScore: number;
}
