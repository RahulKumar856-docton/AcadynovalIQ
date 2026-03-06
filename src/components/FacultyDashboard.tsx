import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  BarChart3, 
  LogOut, 
  Search, 
  Filter, 
  MoreVertical,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  BrainCircuit,
  X,
  Edit3,
  Sparkles,
  Trash2
} from 'lucide-react';
import { User, Quiz, Submission } from '../types';
import { cn } from '../utils';
import { api, socket } from '../services/api';
import { aiService } from '../services/ai';
import Markdown from 'react-markdown';

interface FacultyDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function FacultyDashboard({ user, onLogout }: FacultyDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({ title: '', dept: 'CS', year: '1st', sem: '1st', questions: [] as { text: string, options: string[], correctAnswer: number }[] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dept: 'All', year: 'All', sem: 'All' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuizSubmissions, setSelectedQuizSubmissions] = useState<any[]>([]);
  const [viewingSubmissionsQuizId, setViewingSubmissionsQuizId] = useState<string | null>(null);
  
  // New question state for manual entry
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  // AI States
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiDept, setAiDept] = useState('CS');
  const [aiYear, setAiYear] = useState('1st');
  const [aiSem, setAiSem] = useState('1st');
  const [generatingAI, setGeneratingAI] = useState(false);
  
  const [showAIAnalyticsModal, setShowAIAnalyticsModal] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();

    socket.on("quiz:submitted", ({ quizId, submissions, avgScore }) => {
      setQuizzes(prev => prev.map(q => 
        q.id === quizId ? { ...q, submissions, avgScore } : q
      ));
    });

    return () => {
      socket.off("quiz:submitted");
    };
  }, []);

  const fetchQuizzes = async () => {
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text || newQuestion.options.some(o => !o)) return;
    
    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...newQuiz.questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setNewQuiz({ ...newQuiz, questions: updatedQuestions });
      setEditingQuestionIndex(null);
    } else {
      setNewQuiz({ ...newQuiz, questions: [...newQuiz.questions, newQuestion] });
    }
    
    setNewQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
    setShowQuestionForm(false);
  };

  const handleEditQuestion = (index: number) => {
    setNewQuestion(newQuiz.questions[index]);
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
  };

  const removeQuestion = (index: number) => {
    setNewQuiz({ ...newQuiz, questions: newQuiz.questions.filter((_, i) => i !== index) });
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuiz.questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }
    try {
      const quiz = await api.createQuiz(newQuiz);
      setQuizzes([quiz, ...quizzes]);
      setShowCreateModal(false);
      setNewQuiz({ title: '', dept: 'CS', year: '1st', sem: '1st', questions: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setGeneratingAI(true);
    try {
      const generated = await aiService.generateQuiz(aiTopic, aiQuestionCount, aiDifficulty);
      setNewQuiz({
        ...newQuiz,
        title: generated.title,
        questions: generated.questions,
        dept: aiDept,
        year: aiYear,
        sem: aiSem
      });
      setShowAIModal(false);
      setShowCreateModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleViewSubmissions = async (quizId: string) => {
    setViewingSubmissionsQuizId(quizId);
    setActiveTab('reports');
    try {
      const data = await api.getQuizSubmissions(quizId);
      setSelectedQuizSubmissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSubmissions = selectedQuizSubmissions.filter(s => 
    s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.student_reg_no && s.student_reg_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const handleAnalyzeQuiz = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setAnalyzingAI(true);
    setShowAIAnalyticsModal(true);
    setAiAnalysis(null);
    try {
      const submissions = await api.getQuizSubmissions(quizId);
      const quiz = quizzes.find(q => q.id === quizId);
      const analysis = await aiService.analyzeSubmissions(quiz?.title || 'Quiz', submissions);
      setAiAnalysis(analysis || "No analysis generated.");
    } catch (err) {
      console.error(err);
      setAiAnalysis("Error generating analysis.");
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleLaunchQuiz = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    try {
      await api.launchQuiz(quizId);
      setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, status: 'live' } : q));
      alert("Quiz launched successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to launch quiz.");
    }
  };

  const handleDeleteQuiz = async (e: React.MouseEvent, quizId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this quiz? This will also remove all student submissions.")) return;
    
    try {
      await api.deleteQuiz(quizId);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      alert("Quiz deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete quiz.");
    }
  };

  const totalSubmissions = quizzes.reduce((acc, q) => acc + (q.submissions || 0), 0);
  const avgScore = quizzes.length > 0 
    ? quizzes.reduce((acc, q) => acc + (q.avgScore || 0), 0) / quizzes.length 
    : 0;

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
            icon={<PlusCircle size={20} />} 
            label="Create Quiz" 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Student Reports" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
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
            <h1 className="text-4xl font-black tracking-tight mb-2 italic">Faculty Dashboard</h1>
            <p className="text-black/40 font-medium">Manage your quizzes and track student participation.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-black text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-black/80 transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            <PlusCircle size={20} /> Create New Quiz
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <StatCard 
                icon={<LayoutDashboard className="text-emerald-600" />} 
                label="Your Quizzes" 
                value={quizzes.length.toString()} 
                trend="+2 this week"
              />
              <StatCard 
                icon={<Users className="text-blue-600" />} 
                label="Total Submissions" 
                value={totalSubmissions.toString()} 
                trend="+12% from last month"
              />
              <StatCard 
                icon={<TrendingUp className="text-purple-600" />} 
                label="Average Performance" 
                value={`${avgScore.toFixed(1)}%`} 
                trend="92% engagement"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Quizzes Table */}
              <div className="lg:col-span-2 bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold italic">Your Recent Quizzes</h2>
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
                      <div className="text-center py-12 text-black/20 font-bold">No quizzes match your filters.</div>
                    ) : quizzes.filter(q => 
                      (filters.dept === 'All' || q.dept === filters.dept) &&
                      (filters.year === 'All' || q.year === filters.year) &&
                      (filters.sem === 'All' || q.sem === filters.sem)
                    ).map((quiz) => (
                    <div 
                      key={quiz.id}
                      onClick={() => handleViewSubmissions(quiz.id)}
                      className="group flex items-center justify-between p-6 rounded-2xl border border-black/5 hover:border-emerald-600/20 hover:bg-emerald-50/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center text-black/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <BarChart3 size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg mb-1">{quiz.title}</h4>
                          <div className="flex items-center gap-4 text-xs font-bold text-black/40 uppercase tracking-widest">
                            <span>{quiz.dept}</span>
                            <span>•</span>
                            <span>{quiz.year} Year</span>
                            <span>•</span>
                            <span>{quiz.sem} Sem</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <div className="text-sm font-black">{quiz.submissions || 0}</div>
                          <div className="text-[10px] uppercase tracking-widest font-bold text-black/40">Submissions</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-600">{quiz.avgScore ? quiz.avgScore.toFixed(1) : 0}%</div>
                          <div className="text-[10px] uppercase tracking-widest font-bold text-black/40">Avg Score</div>
                        </div>
                        {quiz.status !== 'live' && (
                          <button 
                            onClick={(e) => handleLaunchQuiz(e, quiz.id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                          >
                            Launch
                          </button>
                        )}
                        <button 
                          onClick={(e) => handleDeleteQuiz(e, quiz.id)}
                          className="p-2 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Quiz"
                        >
                          <Trash2 size={20} />
                        </button>
                        <button className="p-2 text-black/20 hover:text-black transition-colors">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights Sidebar */}
              <div className="space-y-8">
                <div className="bg-black text-white rounded-[32px] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-20"><BrainCircuit size={80} /></div>
                  <h3 className="text-2xl font-bold mb-4 italic relative z-10">AI Smart Ranking</h3>
                  <p className="text-white/60 text-sm mb-8 relative z-10">Generate AI-powered student rankings based on speed, accuracy, and consistency.</p>
                  <button 
                    onClick={() => {
                      if (quizzes.length > 0) {
                        handleAnalyzeQuiz(quizzes[0].id);
                      }
                    }}
                    className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 relative z-10"
                  >
                    Generate Insights
                  </button>
                </div>

                <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
                  <h3 className="text-xl font-bold mb-6 italic">Quick Actions</h3>
                  <div className="space-y-3">
                    <QuickAction icon={<PlusCircle size={18} />} label="New Assessment" onClick={() => setShowCreateModal(true)} />
                    <QuickAction icon={<BrainCircuit size={18} />} label="AI Quiz Builder" onClick={() => setShowAIModal(true)} />
                    <QuickAction icon={<Users size={18} />} label="Manage Cohorts" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-[32px] border border-black/5 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold italic">Student Submissions</h2>
                <p className="text-black/40 text-sm font-medium">
                  {viewingSubmissionsQuizId 
                    ? `Viewing reports for: ${quizzes.find(q => q.id === viewingSubmissionsQuizId)?.title}`
                    : 'Select a quiz from the dashboard to view detailed reports.'}
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Name or Reg No..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all w-full md:w-80"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-black/5">
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Student</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Reg No</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Score</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Time</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Accuracy</th>
                    <th className="pb-4 text-[10px] uppercase tracking-widest font-black text-black/40">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-black/20 font-bold">
                        {viewingSubmissionsQuizId ? 'No submissions found matching your search.' : 'No quiz selected.'}
                      </td>
                    </tr>
                  ) : filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="group hover:bg-black/[0.02] transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {sub.student_name[0]}
                          </div>
                          <span className="font-bold text-sm">{sub.student_name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-xs font-bold text-black/40">{sub.student_reg_no || 'N/A'}</span>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "font-black text-sm",
                          sub.score >= 80 ? "text-emerald-600" : sub.score >= 60 ? "text-blue-600" : "text-red-500"
                        )}>
                          {sub.score}%
                        </span>
                      </td>
                      <td className="py-4 text-sm font-bold text-black/60">{sub.time_taken}s</td>
                      <td className="py-4 text-sm font-bold text-black/60">{sub.accuracy.toFixed(1)}%</td>
                      <td className="py-4 text-xs font-bold text-black/40">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create Quiz Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 p-2 text-black/20 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black italic mb-2">Quiz Builder</h2>
              <p className="text-black/40 text-sm mb-8 font-medium">Design your assessment manually or with AI assistance.</p>

              <div className="flex items-center gap-4 mb-8">
                <button 
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="flex-1 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all"
                >
                  <Sparkles size={18} /> Generate with AI
                </button>
                <div className="w-px h-8 bg-black/5" />
                <button 
                  type="button"
                  onClick={() => {
                    setNewQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
                    setEditingQuestionIndex(null);
                    setShowQuestionForm(true);
                  }}
                  className="flex-1 py-3 bg-black/5 border border-black/5 text-black/60 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/10 transition-all"
                >
                  <PlusCircle size={18} /> Add Manually
                </button>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest font-black text-black/40">Basic Info</label>
                  <input 
                    type="text" 
                    placeholder="Quiz Title (e.g. Data Structures - Arrays)" 
                    required
                    value={newQuiz.title}
                    onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                  
                  <div className="grid grid-cols-3 gap-3">
                    <select 
                      value={newQuiz.dept}
                      onChange={e => setNewQuiz({ ...newQuiz, dept: e.target.value })}
                      className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none"
                    >
                      <option value="CS">CS</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                    </select>
                    <select 
                      value={newQuiz.year}
                      onChange={e => setNewQuiz({ ...newQuiz, year: e.target.value })}
                      className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none"
                    >
                      <option value="1st">1st Yr</option>
                      <option value="2nd">2nd Yr</option>
                      <option value="3rd">3rd Yr</option>
                      <option value="4th">4th Yr</option>
                    </select>
                    <select 
                      value={newQuiz.sem}
                      onChange={e => setNewQuiz({ ...newQuiz, sem: e.target.value })}
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-widest font-black text-black/40">Questions ({newQuiz.questions.length})</label>
                  </div>

                  {showQuestionForm && (
                    <div className="p-6 bg-black/5 rounded-2xl space-y-4 border border-emerald-600/20 shadow-inner">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
                          {editingQuestionIndex !== null ? "Edit Question" : "New Question"}
                        </span>
                        <button type="button" onClick={() => { setShowQuestionForm(false); setEditingQuestionIndex(null); }} className="text-black/20 hover:text-black"><X size={16} /></button>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Enter your question here..." 
                        value={newQuestion.text}
                        onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                        className="w-full px-4 py-3 bg-white rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {newQuestion.options.map((opt, i) => (
                          <div key={i} className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            newQuestion.correctAnswer === i ? "bg-emerald-50 border-emerald-600/30" : "bg-white border-black/5"
                          )}>
                            <input 
                              type="radio" 
                              name="correct" 
                              checked={newQuestion.correctAnswer === i}
                              onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                              className="w-4 h-4 accent-emerald-600"
                            />
                            <input 
                              type="text" 
                              placeholder={`Option ${i + 1}`}
                              value={opt}
                              onChange={e => {
                                const newOpts = [...newQuestion.options];
                                newOpts[i] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: newOpts });
                              }}
                              className="flex-1 bg-transparent text-xs font-bold focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                      <button 
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-500 transition-all"
                      >
                        {editingQuestionIndex !== null ? "Update Question" : "Add to Quiz"}
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {newQuiz.questions.length === 0 && !showQuestionForm && (
                      <div className="py-12 text-center border-2 border-dashed border-black/5 rounded-[32px]">
                        <p className="text-black/20 font-bold text-sm">No questions added yet.</p>
                      </div>
                    )}
                    {newQuiz.questions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white border border-black/5 rounded-2xl group hover:border-emerald-600/20 transition-all shadow-sm">
                        <div className="flex-1 pr-4">
                          <div className="text-sm font-bold mb-1 leading-tight">{q.text}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                              Correct: {q.options[q.correctAnswer]}
                            </span>
                            <span className="text-[10px] text-black/20 font-bold uppercase tracking-widest">
                              {q.options.length} Options
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => handleEditQuestion(i)}
                            className="p-2 text-black/20 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeQuestion(i)}
                            className="p-2 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-black text-white font-black rounded-2xl hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-black/10"
                >
                  Launch Quiz
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Quiz Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl"
            >
              <button 
                onClick={() => setShowAIModal(false)}
                className="absolute top-6 right-6 p-2 text-black/20 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black italic mb-2">AI Quiz Builder</h2>
              <p className="text-black/40 text-sm mb-8 font-medium">Enter a topic and let AI generate a quiz for you.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-black/40">Topic</label>
                  <input 
                    type="text" 
                    placeholder="Topic (e.g. React Hooks, Photosynthesis)" 
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-black/40">No. of Questions</label>
                    <input 
                      type="number" 
                      min="1"
                      max="20"
                      value={isNaN(aiQuestionCount) ? '' : aiQuestionCount}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setAiQuestionCount(isNaN(val) ? 0 : val);
                      }}
                      className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-black/40">Difficulty</label>
                    <select 
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value)}
                      className="w-full px-6 py-4 bg-black/5 rounded-2xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-black/40">Target Audience</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select 
                      value={aiDept}
                      onChange={e => setAiDept(e.target.value)}
                      className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    >
                      <option value="CS">CS</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                    </select>
                    <select 
                      value={aiYear}
                      onChange={e => setAiYear(e.target.value)}
                      className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    >
                      <option value="1st">1st Yr</option>
                      <option value="2nd">2nd Yr</option>
                      <option value="3rd">3rd Yr</option>
                      <option value="4th">4th Yr</option>
                    </select>
                    <select 
                      value={aiSem}
                      onChange={e => setAiSem(e.target.value)}
                      className="px-4 py-4 bg-black/5 rounded-2xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
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
                </div>
                
                <button 
                  onClick={handleAIGenerate}
                  disabled={generatingAI}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-100 disabled:opacity-50"
                >
                  {generatingAI ? "Generating..." : "Generate Quiz"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Analytics Modal */}
      <AnimatePresence>
        {showAIAnalyticsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIAnalyticsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] p-10 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAIAnalyticsModal(false)}
                className="absolute top-6 right-6 p-2 text-black/20 hover:text-black transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-3xl font-black italic mb-2">AI Performance Insights</h2>
              <p className="text-black/40 text-sm mb-8 font-medium">Smart ranking and accuracy analysis.</p>

              {analyzingAI ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="font-bold text-black/40">AI is analyzing submissions...</p>
                </div>
              ) : (
                <div className="markdown-body prose prose-sm max-w-none">
                  <Markdown>{aiAnalysis || ""}</Markdown>
                </div>
              )}
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

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
          {trend}
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

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl border border-black/5 hover:border-black transition-all group"
    >
      <div className="flex items-center gap-3 font-bold text-sm">
        <span className="text-black/40 group-hover:text-black transition-colors">{icon}</span>
        {label}
      </div>
      <ChevronRight size={16} className="text-black/20 group-hover:text-black transition-colors" />
    </button>
  );
}
