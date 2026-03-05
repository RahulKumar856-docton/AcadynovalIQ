import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';
import { User } from './types';
import { getAuthToken, removeAuthToken } from './services/api';

export default function App() {
  const [view, setView] = useState<'landing' | 'faculty' | 'student'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        setView(payload.role === 'faculty' ? 'faculty' : 'student');
      } catch (e) {
        removeAuthToken();
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user: User, token: string) => {
    setUser(user);
    localStorage.setItem('token', token);
    setView(user.role === 'faculty' ? 'faculty' : 'student');
  };

  const handleLogout = () => {
    setUser(null);
    removeAuthToken();
    setView('landing');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {view === 'landing' && <LandingPage onLoginSuccess={handleLoginSuccess} />}
      {view === 'faculty' && user && <FacultyDashboard user={user} onLogout={handleLogout} />}
      {view === 'student' && user && <StudentDashboard user={user} onLogout={handleLogout} />}
    </div>
  );
}
