import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Brain, Zap, BarChart3, GraduationCap, Users, ShieldCheck, X } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface LandingPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showAuth, setShowAuth] = useState<{ role: UserRole, type: 'login' | 'signup' } | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', reg_no: '', dept: 'CS', year: '1st', sem: '1st' });
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = showAuth?.type === 'login' 
        ? await api.login({ email: formData.email, password: formData.password })
        : await api.signup({ ...formData, role: showAuth?.role });
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <span className="text-2xl font-bold tracking-tight">Acadynova<span className="text-emerald-600 italic">IQ</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-black/60">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#about" className="hover:text-black transition-colors">About</a>
            <button onClick={() => setShowAuth({ role: 'student', type: 'login' })} className="hover:text-black transition-colors">Log In</button>
            <button 
              onClick={() => setShowAuth({ role: 'student', type: 'signup' })}
              className="px-6 py-2.5 bg-black text-white rounded-full hover:bg-black/80 transition-all active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Zap size={14} />
            Intelligent Nano-Learning Platform
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
          >
            REDEFINING <br />
            <span className="text-emerald-600 italic">ACADEMIC</span> EXCELLENCE.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-black/60 leading-relaxed mb-12"
          >
            A real-time micro-assessment platform designed to track, analyze, and boost student performance through AI-driven insights.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => setShowAuth({ role: 'student', type: 'signup' })}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group"
            >
              Start Learning <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setShowAuth({ role: 'faculty', type: 'login' })}
              className="w-full sm:w-auto px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-black/80 transition-all flex items-center justify-center gap-2"
            >
              Faculty Portal <Users size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-20 px-6 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div 
            whileHover={{ y: -10 }}
            className="p-10 bg-white rounded-[40px] border border-black/5 shadow-sm group cursor-pointer"
            onClick={() => setShowAuth({ role: 'student', type: 'login' })}
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-4 italic">Student Portal</h3>
            <p className="text-black/60 text-lg mb-8">Access your quizzes, track your progress, and unlock AI insights to master your subjects.</p>
            <div className="flex items-center gap-2 font-bold text-emerald-600">
              Login as Student <ArrowRight size={20} />
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -10 }}
            className="p-10 bg-white rounded-[40px] border border-black/5 shadow-sm group cursor-pointer"
            onClick={() => setShowAuth({ role: 'faculty', type: 'login' })}
          >
            <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center text-black mb-8 group-hover:bg-black group-hover:text-white transition-colors">
              <Users size={32} />
            </div>
            <h3 className="text-3xl font-bold mb-4 italic">Faculty Portal</h3>
            <p className="text-black/60 text-lg mb-8">Create assessments, monitor cohorts, and generate detailed reports with AI-powered analytics.</p>
            <div className="flex items-center gap-2 font-bold text-black">
              Login as Faculty <ArrowRight size={20} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuth(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowAuth(null)}
                className="absolute top-6 right-6 p-2 text-black/20 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black italic mb-2">
                {showAuth.type === 'login' ? 'Welcome Back' : 'Join AcadynovaIQ'}
              </h2>
              <p className="text-black/40 text-sm mb-8 font-medium">
                {showAuth.role === 'faculty' ? 'Faculty' : 'Student'} {showAuth.type === 'login' ? 'Login' : 'Registration'}
              </p>

              <form onSubmit={handleAuth} className="space-y-4">
                {showAuth.type === 'signup' && (
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                )}
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                />
                
                {showAuth.type === 'signup' && showAuth.role === 'student' && (
                  <>
                    <input 
                      type="text" 
                      placeholder="Registration Number (e.g. 2023CS001)" 
                      required
                      value={formData.reg_no}
                      onChange={e => setFormData({ ...formData, reg_no: e.target.value })}
                      className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <select 
                        value={formData.dept}
                        onChange={e => setFormData({ ...formData, dept: e.target.value })}
                        className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none"
                      >
                        <option value="CS">CS</option>
                        <option value="IT">IT</option>
                        <option value="ECE">ECE</option>
                      </select>
                      <select 
                        value={formData.year}
                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                        className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none"
                      >
                        <option value="1st">1st Yr</option>
                        <option value="2nd">2nd Yr</option>
                        <option value="3rd">3rd Yr</option>
                        <option value="4th">4th Yr</option>
                      </select>
                      <select 
                        value={formData.sem}
                        onChange={e => setFormData({ ...formData, sem: e.target.value })}
                        className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none"
                      >
                        <option value="1st">1st Sem</option>
                        <option value="2nd">2nd Sem</option>
                        <option value="3rd">3rd Sem</option>
                        <option value="4th">4th Sem</option>
                        <option value="5th">5th Sem</option>
                        <option value="6th">6th Sem</option>
                        <option value="7th">7th Sem</option>
                        <option value="8th">8th Sem</option>
                      </select>
                    </div>
                  </>
                )}

                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                <button className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-100">
                  {showAuth.type === 'login' ? 'Login' : 'Create Account'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setShowAuth({ ...showAuth, type: showAuth.type === 'login' ? 'signup' : 'login' })}
                  className="text-sm font-bold text-black/40 hover:text-black transition-colors"
                >
                  {showAuth.type === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-emerald-600 mb-6"><Zap size={40} /></div>
              <h4 className="text-2xl font-bold mb-4">Nano-Learning</h4>
              <p className="text-black/60 leading-relaxed">Frequent, focused micro-assessments that ensure continuous learning and better retention of complex concepts.</p>
            </div>
            <div>
              <div className="text-emerald-600 mb-6"><Brain size={40} /></div>
              <h4 className="text-2xl font-bold mb-4">AI Analytics</h4>
              <p className="text-black/60 leading-relaxed">Intelligent performance tracking that identifies weak areas and provides personalized growth paths for every student.</p>
            </div>
            <div>
              <div className="text-emerald-600 mb-6"><BarChart3 size={40} /></div>
              <h4 className="text-2xl font-bold mb-4">Real-time Reports</h4>
              <p className="text-black/60 leading-relaxed">Instant feedback for students and comprehensive cohort analysis for faculty members to drive academic success.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-black text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 italic leading-tight">Empowering the next generation of learners.</h2>
              <p className="text-white/60 text-lg">AcadynovaIQ is more than just a quiz tool. It's a complete ecosystem for academic excellence, built for the modern educational landscape.</p>
            </div>
            <div className="flex gap-12">
              <div className="text-center">
                <div className="text-6xl font-black text-emerald-500 mb-2">98%</div>
                <div className="text-sm uppercase tracking-widest font-bold opacity-60">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-black text-emerald-500 mb-2">10k+</div>
                <div className="text-sm uppercase tracking-widest font-bold opacity-60">Quizzes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="text-xl font-bold tracking-tight">Acadynova<span className="text-emerald-600 italic">IQ</span></span>
          </div>
          <div className="text-black/40 text-sm">
            © 2026 AcadynovaIQ. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black">Privacy</a>
            <a href="#" className="hover:text-black">Terms</a>
            <a href="#" className="hover:text-black">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
