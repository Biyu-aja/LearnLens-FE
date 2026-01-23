    "use client";

import { useState, useEffect, useMemo } from "react";
import { MessageCircle, Trophy, Target, Clock, TrendingUp, Loader2, Sparkles, X, ChevronDown, ChevronUp, History, BrainCircuit, ArrowUpRight, Calendar } from "lucide-react";
import { analyticsAPI, MaterialAnalytics, ChatMessage, QuizAttempt, LearningEvaluation } from "@/lib/api";

interface AnalyticsPanelProps {
  materialId: string;
}

export function AnalyticsPanel({ materialId }: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<MaterialAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Evaluation states
  const [evaluations, setEvaluations] = useState<LearningEvaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<LearningEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchAnalytics();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchEvaluations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getMaterialAnalytics(materialId);
      setAnalytics(response.analytics);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message || "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await analyticsAPI.getEvaluations(materialId);
      setEvaluations(response.evaluations);
      if (response.evaluations.length > 0) {
        setSelectedEvaluation(response.evaluations[0]);
      }
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // Silently fail - evaluations may not exist yet
      console.log("No evaluations yet");
    }
  };

  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true);
      setEvalError(null);
      const response = await analyticsAPI.evaluateLearning(materialId);
      setSelectedEvaluation(response.evaluation);
      setEvaluations(prev => [response.evaluation, ...prev]);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setEvalError(err.message || "Failed to generate evaluation");
    } finally {
      setIsEvaluating(false);
    }
  };

  // derived state for visualization
  const chartData = useMemo(() => {
    if (!analytics?.quizPerformance?.recentAttempts) return [];
    // Take last 10 attempts and reverse for chronological order
    return [...analytics.quizPerformance.recentAttempts].reverse().slice(-10);
  }, [analytics]);

  // Derived recommendation
  const recommendation = useMemo(() => {
    if (!analytics) return null;
    const { chatActivity, quizPerformance } = analytics;
    
    if (chatActivity.totalQuestions === 0 && quizPerformance.totalAttempts === 0) {
      return {
        text: "Start by asking questions to understand the material better, or jump straight into a quiz!",
        action: "Start Chatting",
        icon: MessageCircle
      };
    }
    
    if (quizPerformance.totalAttempts > 0 && quizPerformance.averageScore < 60) {
      return {
        text: "Your quiz scores indicate some gaps. Try asking the AI to explain the concepts you missed.",
        action: "Review Concepts",
        icon: BrainCircuit
      };
    }

    if (quizPerformance.totalAttempts > 0 && quizPerformance.averageScore >= 85) {
      return {
        text: "Excellent grasp of the material! You might be ready to move on to more advanced topics.",
        action: "Challenge Yourself",
        icon: Trophy
      };
    }

    if (chatActivity.totalQuestions > 5 && quizPerformance.totalAttempts === 0) {
      return {
        text: "You've asked good questions. Now, test your knowledge with a quick quiz!",
        action: "Take a Quiz",
        icon: Target
      };
    }

    return {
      text: "Keep up the consistent study habit to reinforce your learning.",
      action: "Continue Studying",
      icon: TrendingUp
    };
  }, [analytics]);


  // Formatters
  const formatEvaluation = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-2">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 text-sm text-foreground-muted">{line.replace(/^[-•] /, '')}</li>;
      }
      if (/^\d+\. /.test(line)) {
        return <li key={i} className="ml-4 text-sm text-foreground-muted">{line.replace(/^\d+\. /, '')}</li>;
      }
      if (!line.trim()) return <br key={i} />;
      return <p key={i} className="text-sm text-foreground-muted">{line}</p>;
    });
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return "No activity yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground-muted mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">Retry</button>
        </div>
      </div>
    );
  }

  const chatActivity = analytics?.chatActivity || { totalQuestions: 0, lastActivity: null, recentMessages: [] };
  const quizPerf = analytics?.quizPerformance || { totalAttempts: 0, averageScore: 0, bestScore: 0, recentAttempts: [] };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 fade-in">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Performance Overview</h2>
            <p className="text-sm text-foreground-muted mt-1">Track your progress and mastery of this material</p>
          </div>
          {recommendation && (
            <div className="hidden sm:flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-xl shadow-sm">
                <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                    <recommendation.icon size={16} />
                </div>
                <div className="text-xs">
                    <p className="font-semibold text-foreground">Suggested</p>
                    <p className="text-foreground-muted">{recommendation.action}</p>
                </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
                label="Total Questions" 
                value={chatActivity.totalQuestions.toString()} 
                icon={MessageCircle} 
                color="blue"
            />
             <StatsCard 
                label="Last Active" 
                value={chatActivity.lastActivity ? formatRelativeTime(chatActivity.lastActivity).split(" ago")[0] : "None"} 
                subValue={chatActivity.lastActivity ? "ago" : ""}
                icon={Clock} 
                color="green"
            />
             <StatsCard 
                label="Avg Quiz Score" 
                value={`${quizPerf.averageScore}%`} 
                icon={TrendingUp} 
                color="purple"
                trend={quizPerf.averageScore >= 80 ? "high" : quizPerf.averageScore >= 60 ? "neutral" : "low"}
            />
             <StatsCard 
                label="Best Score" 
                value={`${quizPerf.bestScore}%`} 
                icon={Trophy} 
                color="amber"
            />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left Column: Charts & Analysis */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Quiz Progress Chart */}
                <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <Target size={18} className="text-primary" />
                            Quiz Performance Trend
                        </h3>
                        <span className="text-xs text-foreground-muted bg-background px-2 py-1 rounded-md border border-border">
                            Last 10 Attempts
                        </span>
                   </div>
                   
                   {chartData.length > 0 ? (
                       <div className="h-48 flex items-end gap-2 sm:gap-4">
                           {chartData.map((attempt, idx) => (
                               <div key={attempt.id} className="flex-1 flex flex-col justify-end items-center group relative">
                                   <div 
                                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-80 relative ${
                                            attempt.percentage >= 80 ? 'bg-emerald-500' : 
                                            attempt.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ height: `${Math.max(attempt.percentage, 5)}%` }}
                                   >
                                       {/* Tooltip */}
                                       <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                           {attempt.percentage}% • {new Date(attempt.createdAt).toLocaleDateString()}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <div className="h-48 flex items-center justify-center flex-col text-foreground-muted border-2 border-dashed border-border rounded-xl bg-background">
                           <Target size={32} className="mb-2 opacity-20" />
                           <p className="text-sm">No quiz data yet</p>
                           <p className="text-xs opacity-70">Complete quizzes to see your trend</p>
                       </div>
                   )}
                   {/* X-Axis Labels */}
                    {chartData.length > 0 && (
                        <div className="flex justify-between items-center text-[10px] text-foreground-muted mt-2 border-t border-border pt-2">
                            <span>Oldest</span>
                            <span>Latest</span>
                        </div>
                    )}
                </div>

                {/* AI Evaluation */}
                <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-white dark:bg-white/10 rounded-lg shadow-sm">
                                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                             </div>
                             <div>
                                <h3 className="font-semibold text-foreground">AI Learning Assessment</h3>
                                <p className="text-xs text-foreground-muted">Deep dive into your understanding</p>
                             </div>
                        </div>
                        <button
                            onClick={handleEvaluate}
                            disabled={isEvaluating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isEvaluating ? <Loader2 size={16} className="animate-spin"/> : <BrainCircuit size={16}/>}
                            {evaluations.length > 0 ? "Re-evaluate" : "Start Evaluation"}
                        </button>
                    </div>

                    {evalError && (
                         <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                             {evalError}
                         </div>
                    )}

                    {selectedEvaluation ? (
                        <div className="bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex justify-between items-start border-b border-indigo-100 dark:border-indigo-900/30 pb-3 mb-3"> 
                                <div>
                                    <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                                        {selectedEvaluation.score}<span className="text-lg text-indigo-400 dark:text-indigo-600 font-normal">/10</span>
                                    </div>
                                    <div className="text-xs text-foreground-muted">Proficiency Score</div>
                                </div>
                                <div className="text-right">
                                     <div className="text-xs text-foreground-muted">{formatDate(selectedEvaluation.createdAt)}</div>
                                     {evaluations.length > 1 && (
                                         <button 
                                            onClick={() => setShowHistory(!showHistory)}
                                            className="text-xs text-indigo-600 hover:underline mt-1 flex items-center justify-end gap-1"
                                         >
                                             History {showHistory ? <ChevronUp size={10}/>:<ChevronDown size={10}/>}
                                         </button>
                                     )}
                                </div>
                            </div>
                            
                            {/* History Dropdown */}
                            {showHistory && (
                                <div className="mb-4 flex flex-wrap gap-2 p-2 bg-surface rounded-lg border border-border">
                                    {evaluations.map((ev, i) => (
                                        <button 
                                            key={ev.id}
                                            onClick={() => setSelectedEvaluation(ev)}
                                            className={`text-xs px-2 py-1 rounded ${selectedEvaluation.id === ev.id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700': 'hover:bg-surface-hover' }`}
                                        >
                                            {formatDate(ev.createdAt)} ({ev.score})
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="prose dark:prose-invert prose-sm max-w-none max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {formatEvaluation(selectedEvaluation.content)}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-indigo-400/60 dark:text-indigo-500/60">
                            <BrainCircuit size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No evaluations generated yet.</p>
                            <p className="text-xs">Click the button above to analyze your learning patterns.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Activity Feeds */}
            <div className="space-y-6">
                 {/* Recommendation Card */}
                 {recommendation && (
                     <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                             <recommendation.icon size={80} />
                         </div>
                         <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                             <Sparkles size={16} className="text-amber-500"/> Insight
                         </h3>
                         <p className="text-sm text-foreground-muted mb-4 leading-relaxed">
                             {recommendation.text}
                         </p>
                         <button className="w-full py-2 bg-surface-hover hover:bg-border rounded-lg text-xs font-medium text-foreground transition-colors flex items-center justify-center gap-2">
                             Action: {recommendation.action} <ArrowUpRight size={12}/>
                         </button>
                     </div>
                 )}

                {/* Recent Activity */}
                <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-primary"/> Recent Interactions
                    </h3>
                    
                    <div className="space-y-4">
                        {chatActivity.recentMessages.length > 0 ? (
                            chatActivity.recentMessages.slice(0, 4).map(msg => (
                                <div key={msg.id} className="flex gap-3 items-start p-2 hover:bg-surface-hover rounded-lg transition-colors">
                                    <div className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md shrink-0">
                                        <MessageCircle size={12} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground line-clamp-2">{msg.content}</p>
                                        <p className="text-[10px] text-foreground-muted mt-1">{formatRelativeTime(msg.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-xs text-foreground-muted py-4">No recent messages</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// Components

function StatsCard({ label, value, subValue, icon: Icon, color, trend }: { 
    label: string, 
    value: string, 
    subValue?: string,
    icon: any, 
    color: 'blue' | 'green' | 'purple' | 'amber',
    trend?: 'high' | 'neutral' | 'low'
}) {
    const colorStyles = {
        blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    };

    return (
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div className="z-10 relative">
                <p className="text-xs font-medium text-foreground-muted mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h4 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</h4>
                    {subValue && <span className="text-xs text-foreground-muted">{subValue}</span>}
                </div>
                {trend && (
                     <div className={`text-[10px] mt-2 font-medium px-2 py-0.5 rounded-full inline-block ${
                         trend === 'high' ? 'bg-green-100 text-green-700' :
                         trend === 'neutral' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'
                     }`}>
                         {trend === 'high' ? 'Excellent' : trend === 'neutral' ? 'On Track' : 'Needs Focus'}
                     </div>
                )}
            </div>
            
            <div className={`p-3 rounded-xl ${colorStyles[color]} relative z-10`}>
                <Icon size={20} />
            </div>

            {/* Decoration */}
            <div className={`absolute -bottom-4 -right-4 opacity-[0.03] dark:opacity-[0.05] p-8 rounded-full ${colorStyles[color].split(' ')[0].replace('/10', '')} transform scale-150 group-hover:scale-175 transition-transform duration-500`} />
        </div>
    )
}
