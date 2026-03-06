import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  LogOut, 
  Search, 
  Filter, 
  ChevronRight,
  Zap,
  Clock,
  Target,
  LineChart,
  BarChart3,
  Brain,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { User, Quiz, StudentStats, Question } from '../types';
import { cn } from '../utils';
import { api, socket } from '../services/api';
import { AnimatePresence } from 'motion/react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState<StudentStats>({ totalQuizzes: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dept: 'All', year: 'All', sem: 'All' });
  
  // Quiz Taking States
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [incomingQuiz, setIncomingQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();

    socket.on("quiz:launched", (newQuiz) => {
      // Check if quiz matches student's criteria
      if (newQuiz.dept === user.dept && newQuiz.year === user.year && newQuiz.sem === user.sem) {
        setQuizzes(prev => {
          const exists = prev.find(q => q.id === newQuiz.id);
          if (exists) {
            return prev.map(q => q.id === newQuiz.id ? newQuiz : q);
          }
          return [newQuiz, ...prev];
        });
        
        // Show notification if not already taking a quiz
        if (!activeQuiz) {
          setIncomingQuiz(newQuiz);
        }
      }
    });

    socket.on("quiz:deleted", (quizId) => {
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      if (activeQuiz?.id === quizId) {
        setActiveQuiz(null);
        alert("This quiz has been removed by the faculty.");
      }
      if (incomingQuiz?.id === quizId) {
        setIncomingQuiz(null);
      }
    });

    return () => {
      socket.off("quiz:launched");
      socket.off("quiz:deleted");
    };
  }, []);

  const fetchData = async () => {
    try {
      const [quizData, statsData] = await Promise.all([
        api.getQuizzes(),
        api.getStudentStats()
      ]);
      setQuizzes(quizData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswers(new Array(quiz.questions?.length || 0).fill(-1));
    setQuizStartTime(Date.now());
  };

  const handleAnswerSelect = (answerIdx: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIdx] = answerIdx;
    setSelectedAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !quizStartTime) return;
    setSubmitting(true);
    
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - quizStartTime) / 1000);
    
    let correctCount = 0;
    activeQuiz.questions?.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    
    const totalQuestions = activeQuiz.questions?.length || 1;
    const accuracy = (correctCount / totalQuestions) * 100;
    const score = Math.round(accuracy);

    try {
      await api.submitQuiz(activeQuiz.id, score, timeTaken, accuracy);
      setQuizzes(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, myScore: score } : q));
      const newStats = await api.getStudentStats();
      setStats(newStats);
      setActiveQuiz(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const performanceData = quizzes
    .filter(q => q.myScore !== undefined)
    .map((q, i) => ({ name: `Quiz ${i + 1}`, score: q.myScore }));

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-black/5 flex flex-col">
        <div className="p-8 flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100">
            A
          </div>
          <span className="text-2xl font-bold tracking-tight">Acadynova<span className="text-emerald-600 italic">IQ</span></span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<BookOpen size={20} />} 
            label="My Quizzes" 
            active={activeTab === 'quizzes'} 
            onClick={() => setActiveTab('quizzes')} 
          />
          <SidebarItem 
            icon={<Trophy size={20} />} 
            label="Performance" 
            active={activeTab === 'performance'} 
            onClick={() => setActiveTab('performance')} 
          />
        </nav>

        <div className="p-6 border-t border-black/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
              {user.name[0]}
            </div>
            <div>
              <div className="font-bold text-sm">{user.name}</div>
              <div className="text-xs text-black/40 uppercase tracking-widest font-bold">{user.role}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 italic">Hello, {user.name}!</h1>
            <p className="text-black/40 font-medium">Here's what's happening with your academic progress.</p>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-black/5 font-bold text-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            {user.reg_no && <span className="text-emerald-600 mr-2">{user.reg_no}</span>}
            {user.year} Year • {user.sem} Sem
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<Zap className="text-emerald-600" />} 
            label="Total Quizzes" 
            value={stats.totalQuizzes.toString()} 
            color="emerald"
          />
          <StatCard 
            icon={<Target className="text-blue-600" />} 
            label="Average Score" 
            value={`${stats.avgScore ? stats.avgScore.toFixed(1) : 0}%`} 
            color="blue"
          />
          <StatCard 
            icon={<Brain className="text-purple-600" />} 
            label="Focus Areas" 
            value="3 Subjects" 
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Quizzes */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold italic">Available Quizzes</h2>
                <div className="flex items-center gap-3">
                  <select 
                    value={filters.dept}
                    onChange={e => setFilters({ ...filters, dept: e.target.value })}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-black/5 rounded-full bg-white focus:outline-none"
                  >
                    <option value="All">All Depts</option>
                    <option value="CS">CS</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                  </select>
                  <select 
                    value={filters.year}
                    onChange={e => setFilters({ ...filters, year: e.target.value })}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-black/5 rounded-full bg-white focus:outline-none"
                  >
                    <option value="All">All Years</option>
                    <option value="1st">1st Yr</option>
                    <option value="2nd">2nd Yr</option>
                    <option value="3rd">3rd Yr</option>
                    <option value="4th">4th Yr</option>
                  </select>
                  <select 
                    value={filters.sem}
                    onChange={e => setFilters({ ...filters, sem: e.target.value })}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-black/5 rounded-full bg-white focus:outline-none"
                  >
                    <option value="All">All Sems</option>
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
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-black/20 font-bold">Loading quizzes...</div>
                ) : quizzes.filter(q => 
                  (filters.dept === 'All' || q.dept === filters.dept) &&
                  (filters.year === 'All' || q.year === filters.year) &&
                  (filters.sem === 'All' || q.sem === filters.sem)
                ).length === 0 ? (
                  <div className="text-center py-12 text-black/20 font-bold">No quizzes available for your selection.</div>
                ) : quizzes.filter(q => 
                  (filters.dept === 'All' || q.dept === filters.dept) &&
                  (filters.year === 'All' || q.year === filters.year) &&
                  (filters.sem === 'All' || q.sem === filters.sem)
                ).map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="group flex items-center justify-between p-6 rounded-2xl border border-black/5 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        quiz.myScore !== undefined ? "bg-emerald-600 text-white" : "bg-black/5 text-black/40 group-hover:bg-emerald-600 group-hover:text-white"
                      )}>
                        {quiz.myScore !== undefined ? <CheckCircle2 size={24} /> : <Zap size={24} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1">{quiz.title}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold text-black/40 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock size={12} /> 15m</span>
                          <span>•</span>
                          <span>10 Questions</span>
                        </div>
                      </div>
                    </div>
                    {quiz.myScore !== undefined ? (
                      <div className="text-right">
                        <div className="text-lg font-black text-emerald-600">{quiz.myScore}%</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-black/40">Your Score</div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleTakeQuiz(quiz)}
                        className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95"
                      >
                        Start Quiz
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Analytics */}
            <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold italic">Performance Analytics</h2>
                <div className="text-xs font-bold uppercase tracking-widest text-black/40">Deep dive into your progress</div>
              </div>
              
              <div className="h-[300px] w-full">
                {performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-black/20 font-bold">No performance data yet. Take a quiz to see your progress!</div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Insights */}
          <div className="space-y-8">
            <div className="bg-emerald-600 text-white rounded-[32px] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20"><Brain size={80} /></div>
              <h3 className="text-2xl font-bold mb-4 italic relative z-10">Subject Mastery</h3>
              <div className="space-y-6 relative z-10">
                <MasteryItem label="Data Structures" progress={85} />
                <MasteryItem label="Operating Systems" progress={62} />
                <MasteryItem label="DBMS" progress={78} />
              </div>
            </div>

            <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6 italic">Recent Results</h3>
              <div className="space-y-4">
                {quizzes.filter(q => q.myScore !== undefined).slice(0, 3).map(quiz => (
                  <ResultItem key={quiz.id} title={quiz.title} score={quiz.myScore!} date="Recently" />
                ))}
                {quizzes.filter(q => q.myScore !== undefined).length === 0 && (
                  <div className="text-center py-4 text-black/20 font-bold text-sm">No results yet.</div>
                )}
              </div>
              <button className="w-full mt-6 py-4 border border-black/5 rounded-2xl font-bold text-sm hover:bg-black hover:text-white transition-all">
                View All Results
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Taking Modal */}
      <AnimatePresence>
        {activeQuiz && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black italic">{activeQuiz.title}</h2>
                  <p className="text-black/40 text-xs font-bold uppercase tracking-widest">
                    Question {currentQuestionIdx + 1} of {activeQuiz.questions?.length}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveQuiz(null)}
                  className="p-2 text-black/20 hover:text-black transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                <div className="space-y-8">
                  <div className="p-6 bg-black/5 rounded-2xl">
                    <h3 className="text-xl font-bold leading-tight">
                      {activeQuiz.questions[currentQuestionIdx].text}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {activeQuiz.questions[currentQuestionIdx].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        className={cn(
                          "w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group",
                          selectedAnswers[currentQuestionIdx] === idx
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                            : "border-black/5 hover:border-black/20 text-black/60"
                        )}
                      >
                        <span>{option}</span>
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          selectedAnswers[currentQuestionIdx] === idx
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-black/10 group-hover:border-black/20"
                        )}>
                          {selectedAnswers[currentQuestionIdx] === idx && <CheckCircle2 size={14} />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                      className="px-6 py-3 font-bold text-sm text-black/40 hover:text-black disabled:opacity-20 transition-colors"
                    >
                      Previous
                    </button>
                    
                    {currentQuestionIdx === activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={submitting || selectedAnswers.includes(-1)}
                        className="px-10 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-100 disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Finish Quiz"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                        disabled={selectedAnswers[currentQuestionIdx] === -1}
                        className="px-10 py-4 bg-black text-white font-black rounded-2xl hover:bg-black/80 transition-all active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50"
                      >
                        Next Question
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <AlertCircle size={48} className="mx-auto text-black/10" />
                  <p className="font-bold text-black/40">This quiz has no questions yet.</p>
                  <button 
                    onClick={() => setActiveQuiz(null)}
                    className="px-6 py-2 bg-black text-white rounded-xl font-bold"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Incoming Quiz Alert Modal */}
      <AnimatePresence>
        {incomingQuiz && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-8 animate-bounce">
                <Zap size={40} fill="currentColor" />
              </div>
              
              <h2 className="text-3xl font-black italic mb-4">Live Quiz Launched!</h2>
              <p className="text-black/60 font-medium mb-8 leading-relaxed">
                Your faculty has just launched <span className="text-black font-bold">"{incomingQuiz.title}"</span>. 
                Attend it now to participate in the real-time assessment.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    handleTakeQuiz(incomingQuiz);
                    setIncomingQuiz(null);
                  }}
                  className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                >
                  Attend Quiz Now <ChevronRight size={20} />
                </button>
                <button 
                  onClick={() => setIncomingQuiz(null)}
                  className="w-full py-4 text-black/40 font-bold text-sm hover:text-black transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all",
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
          : "text-black/60 hover:bg-black/5 hover:text-black"
      )}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  }[color] || "bg-gray-50 text-gray-600";

  return (
    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 overflow-hidden">
        <div className={cn("w-full h-full flex items-center justify-center", colorClasses)}>
          {icon}
        </div>
      </div>
      <div className="text-4xl font-black mb-1">{value}</div>
      <div className="text-sm font-bold text-black/40 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-black/5 rounded-full hover:bg-black hover:text-white transition-all">
      {label}
    </button>
  );
}

function MasteryItem({ label, progress }: { label: string, progress: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full bg-white rounded-full"
        />
      </div>
    </div>
  );
}

interface ResultItemProps {
  title: string;
  score: number;
  date: string;
}

const ResultItem: React.FC<ResultItemProps> = ({ title, score, date }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-bold text-sm">{title}</div>
        <div className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{date}</div>
      </div>
      <div className={cn(
        "font-black text-sm",
        score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : "text-red-500"
      )}>
        {score}%
      </div>
    </div>
  );
}
