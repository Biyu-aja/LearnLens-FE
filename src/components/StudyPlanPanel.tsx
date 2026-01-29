import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { aiAPI, StudyPlan, StudyTask } from "@/lib/api";
import { Loader2, Calendar, CheckCircle2, Circle, RefreshCw, BookOpen, Clock, MoreVertical, MessageSquare, HelpCircle, CheckSquare, AlertTriangle, X, CheckCircle, XCircle, Send } from "lucide-react";

interface StudyPlanPanelProps {
  materialId: string;
  language?: string;
  onVerify?: (task: string) => void;
  onLearn?: (task: string) => void;
  onQuiz?: (task: string) => void;
}

// Verification Modal States
type VerificationState = 
  | "prompt" // Initial prompt asking if user wants to verify
  | "loading-question" // Loading essay question from AI
  | "answering" // User is typing their answer
  | "evaluating" // AI is evaluating the answer
  | "result"; // Showing pass/fail result

interface EvaluationResult {
  passed: boolean;
  score: number;
  feedback: string;
  correctAnswer?: string;
}

export default function StudyPlanPanel({ materialId, language = "en", onVerify, onLearn, onQuiz }: StudyPlanPanelProps) {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [focus, setFocus] = useState("");
  const [verifyingTask, setVerifyingTask] = useState<StudyTask | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Verification modal state
  const [verificationState, setVerificationState] = useState<VerificationState>("prompt");
  const [essayQuestion, setEssayQuestion] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    setMounted(true);
    loadPlan();
  }, [materialId]);

  const loadPlan = async () => {
    try {
      setIsLoading(true);
      const data = await aiAPI.getStudyPlan(materialId);
      if (data.success && data.plan) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to load study plan", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const data = await aiAPI.generateStudyPlan(materialId, language, undefined, undefined, focus);
      if (data.success && data.plan) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to generate study plan", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskClick = (task: StudyTask) => {
    if (task.isCompleted) {
      // If already completed, toggle off immediately
      executeToggleTask(task.id, true);
    } else {
      // If not completed, open verification modal
      setVerifyingTask(task);
      setVerificationState("prompt");
      setEssayQuestion("");
      setQuestionDescription("");
      setUserAnswer("");
      setEvaluationResult(null);
    }
  };

  const executeToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!plan) return;
    
    const updatedTasks = plan.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !currentStatus } : t
    );
    setPlan({ ...plan, tasks: updatedTasks });

    try {
      await aiAPI.updateStudyTask(taskId, !currentStatus);
    } catch (error) {
      console.error("Failed to update task", error);
      loadPlan();
    }
  };

  const handleStartQuiz = async () => {
    if (!verifyingTask) return;
    
    setVerificationState("loading-question");
    
    try {
      const response = await aiAPI.generateTaskQuestion(verifyingTask.id, language);
      if (response.success) {
        setEssayQuestion(response.question);
        setQuestionDescription(response.description || "");
        setVerificationState("answering");
      } else {
        // Fallback question
        setEssayQuestion(`Apa yang Anda pahami tentang "${verifyingTask.task}"?`);
        setQuestionDescription(`Jelaskan konsep utama dengan kata-kata Anda sendiri.`);
        setVerificationState("answering");
      }
    } catch (error) {
      console.error("Failed to generate question", error);
      setEssayQuestion(`Apa yang Anda pahami tentang "${verifyingTask.task}"?`);
      setQuestionDescription(`Jelaskan konsep utama dengan kata-kata Anda sendiri.`);
      setVerificationState("answering");
    }
  };

  const handleSubmitAnswer = async () => {
    if (!verifyingTask || !userAnswer.trim()) return;
    
    setVerificationState("evaluating");
    
    try {
      const response = await aiAPI.evaluateTaskAnswer(
        verifyingTask.id,
        essayQuestion,
        userAnswer,
        language
      );
      
      if (response.success) {
        setEvaluationResult({
          passed: response.passed,
          score: response.score,
          feedback: response.feedback,
          correctAnswer: response.correctAnswer,
        });
        
        // If passed, update local state (backend already updated)
        if (response.passed && plan) {
          const updatedTasks = plan.tasks.map(t => 
            t.id === verifyingTask.id ? { ...t, isCompleted: true } : t
          );
          setPlan({ ...plan, tasks: updatedTasks });
        }
        
        setVerificationState("result");
      }
    } catch (error) {
      console.error("Failed to evaluate answer", error);
      setEvaluationResult({
        passed: false,
        score: 0,
        feedback: "Failed to evaluate your answer. Please try again.",
      });
      setVerificationState("result");
    }
  };

  const handleVerifySkip = () => {
    if (verifyingTask) {
      executeToggleTask(verifyingTask.id, false);
      closeModal();
    }
  };

  const handleTryAgain = () => {
    setUserAnswer("");
    setVerificationState("answering");
  };

  const closeModal = () => {
    setVerifyingTask(null);
    setVerificationState("prompt");
    setEssayQuestion("");
    setQuestionDescription("");
    setUserAnswer("");
    setEvaluationResult(null);
  };

  // Calculate progress
  const totalTasks = plan?.tasks.length || 0;
  const completedTasks = plan?.tasks.filter(t => t.isCompleted).length || 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Group tasks by day
  const tasksByDay = plan?.tasks.reduce((acc, task) => {
    if (!acc[task.day]) acc[task.day] = [];
    acc[task.day].push(task);
    return acc;
  }, {} as Record<number, StudyTask[]>) || {};

  const sortedDays = Object.keys(tasksByDay).map(Number).sort((a, b) => a - b);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Create Your Study Plan
          </h3>
          <p className="text-[var(--foreground-muted)] mb-6">
            Generate a personalized study plan based on your learning material. Track your progress and verify understanding as you go.
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Optional: Focus area (e.g., 'exam prep', 'quick review')"
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Generate Study Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render verification modal
  const renderVerificationModal = () => {
    if (!verifyingTask) return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
        // Don't close modal on backdrop click - user must use X button or complete the flow
      >
        <div 
          className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              {verificationState === "prompt" && "Verify Understanding"}
              {verificationState === "loading-question" && "Loading Question..."}
              {verificationState === "answering" && "Answer the Question"}
              {verificationState === "evaluating" && "Evaluating..."}
              {verificationState === "result" && (evaluationResult?.passed ? "🎉 Passed!" : "Try Again")}
            </h3>
            <button onClick={closeModal} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Initial Prompt */}
            {verificationState === "prompt" && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-gray-300 mb-2">
                  You're marking this task as complete:
                </p>
                <p className="text-white font-medium mb-6 text-lg">
                  "{verifyingTask.task}"
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Answer a quick essay question to verify your understanding, or skip to mark as done without verification.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleStartQuiz}
                    className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Take Verification Quiz
                  </button>
                  
                  <button
                    onClick={handleVerifySkip}
                    className="w-full bg-gray-800 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Skip & Mark as Done
                  </button>
                </div>
              </div>
            )}

            {/* Loading Question */}
            {verificationState === "loading-question" && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Generating question...</p>
                <p className="text-sm text-gray-500">
                  Topic: <span className="text-indigo-400">{verifyingTask.task}</span>
                </p>
              </div>
            )}

            {/* Answering */}
            {verificationState === "answering" && (
              <div>
                {/* Topic Badge */}
                <div className="mb-4 p-3 bg-indigo-900/30 border border-indigo-800 rounded-xl">
                  <p className="text-xs text-indigo-400 mb-1">📚 Topik yang diuji:</p>
                  <p className="text-indigo-200 font-medium">{verifyingTask.task}</p>
                </div>

                {/* Question */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Pertanyaan:</p>
                  <p className="text-white text-lg leading-relaxed">{essayQuestion}</p>
                  {questionDescription && (
                    <p className="text-gray-400 text-sm mt-3 p-3 bg-gray-800/50 rounded-lg">💡 <span className="font-medium">Hint:</span> {questionDescription}</p>
                  )}
                </div>
                
                {/* Answer Input */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Jawaban Anda:</p>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Ketik jawaban Anda di sini... (2-4 kalimat sudah cukup)"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    autoFocus
                  />
                </div>
                
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  Submit Answer
                </button>
              </div>
            )}

            {/* Evaluating */}
            {verificationState === "evaluating" && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-300">Evaluating your answer...</p>
              </div>
            )}

            {/* Result */}
            {verificationState === "result" && evaluationResult && (
              <div>
                {/* Pass/Fail Icon */}
                <div className="text-center mb-6">
                  {evaluationResult.passed ? (
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                  )}
                  
                  <div className={`text-3xl font-bold ${evaluationResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                    {evaluationResult.score}/100
                  </div>
                  <p className={`text-sm ${evaluationResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {evaluationResult.passed ? "Great job! Task marked as complete." : "Score below 60. Keep studying!"}
                  </p>
                </div>

                {/* Feedback */}
                <div className="bg-gray-800 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Feedback:</p>
                  <p className="text-white">{evaluationResult.feedback}</p>
                </div>

                {/* Correct Answer (if failed) */}
                {!evaluationResult.passed && evaluationResult.correctAnswer && (
                  <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-400 mb-1">Key points you might have missed:</p>
                    <p className="text-blue-200">{evaluationResult.correctAnswer}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {evaluationResult.passed ? (
                    <button
                      onClick={closeModal}
                      className="w-full bg-green-600 text-white font-medium py-3 rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Continue
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleTryAgain}
                        className="flex-1 bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={closeModal}
                        className="flex-1 bg-gray-800 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background)]">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Study Plan</h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
            title="Regenerate Plan"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Regenerate with focus */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="Focus area (optional)"
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? "..." : "Regenerate"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {sortedDays.map((day) => (
            <div key={day} className="relative pl-8 border-l-2 border-[var(--border)] last:border-l-0 pb-2">
              {/* Day Marker */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--primary)] ring-4 ring-[var(--surface)]" />
              
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 -mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--foreground-muted)]" />
                Day {day}
              </h3>

              <div className="space-y-3">
                {tasksByDay[day].map((task) => (
                  <div 
                    key={task.id}
                    className={`
                      group flex items-start gap-4 p-4 rounded-xl border transition-all relative hover:z-10
                      ${task.isCompleted 
                        ? "bg-[var(--surface-hover)] border-transparent opacity-75" 
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]"
                      }
                    `}
                  >
                    <div 
                      onClick={() => handleTaskClick(task)}
                      className={`
                        mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer
                        ${task.isCompleted
                          ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                          : "border-[var(--foreground-muted)] text-transparent hover:border-[var(--primary)]"
                        }
                      `}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`
                        font-medium mb-1 transition-all
                        ${task.isCompleted ? "text-[var(--foreground-muted)] line-through" : "text-[var(--foreground)]"}
                      `}>
                        {task.task}
                      </h4>
                      {task.description && (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Quick actions on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {onLearn && (
                        <button 
                          onClick={() => onLearn(task.task)}
                          className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)]"
                          title="Learn more"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      )}
                      {onVerify && (
                        <button 
                          onClick={() => onVerify(task.task)}
                          className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)]"
                          title="Ask about this"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      {onQuiz && (
                        <button 
                          onClick={() => onQuiz(task.task)}
                          className="p-2 rounded-lg bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)]"
                          title="Quick quiz"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Modal */}
      {mounted && renderVerificationModal()}
    </div>
  );
}
