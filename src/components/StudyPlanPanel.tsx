import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { aiAPI, StudyPlan, StudyTask } from "@/lib/api";
import { Loader2, Calendar, CheckCircle2, Circle, RefreshCw, BookOpen, Clock, MoreVertical, MessageSquare, HelpCircle, CheckSquare, AlertTriangle, X } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

interface StudyPlanPanelProps {
  materialId: string;
  language?: string;
  onVerify?: (task: string) => void;
  onLearn?: (task: string) => void;
  onQuiz?: (task: string) => void;
}

export default function StudyPlanPanel({ materialId, language = "en", onVerify, onLearn, onQuiz }: StudyPlanPanelProps) {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [focus, setFocus] = useState("");
  const [verifyingTask, setVerifyingTask] = useState<StudyTask | null>(null);
  const [mounted, setMounted] = useState(false);
  const { customConfig } = useSettings();

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
      const data = await aiAPI.generateStudyPlan(materialId, language, undefined, customConfig, focus);
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
      // If not completed, ask for verification
      setVerifyingTask(task);
    }
  };

  const executeToggleTask = async (taskId: string, currentStatus: boolean) => {
    // Optimistic update
    if (!plan) return;
    
    // If we are marking as complete (currentStatus is false), we are toggling TO true
    // If we are marking as uncomplete (currentStatus is true), we are toggling TO false
    // The argument currentStatus represents the status BEFORE the toggle. 
    // Wait, typical toggle logic: newStatus = !currentStatus.
    
    const updatedTasks = plan.tasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !currentStatus } : t
    );
    setPlan({ ...plan, tasks: updatedTasks });

    try {
      await aiAPI.updateStudyTask(taskId, !currentStatus);
    } catch (error) {
      console.error("Failed to update task", error);
      // Revert on failure
      loadPlan();
    }
  };

  const handleVerifyQuiz = () => {
    if (verifyingTask && onQuiz) {
      onQuiz(`Give me a 1-question multiple choice quiz to verify I understand this task: ${verifyingTask.task}. Keep it brief.`);
      setVerifyingTask(null);
    }
  };

  const handleVerifySkip = () => {
    if (verifyingTask) {
      executeToggleTask(verifyingTask.id, false); // current status is false (uncompleted)
      setVerifyingTask(null);
    }
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
      <div className="flex flex-col items-center justify-center p-12 text-[var(--foreground-muted)]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading study plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 bg-[var(--surface-hover)] rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-[var(--primary)]" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
          No Study Plan Yet
        </h3>
        <p className="text-[var(--foreground-muted)] max-w-md mb-8">
          Create a personalized study schedule based on this material. 
          The AI will break down the content into manageable daily tasks.
          The AI will break down the content into manageable daily tasks.
        </p>
        
        <div className="w-full max-w-md mb-6">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2 text-left">
            Study Goal / Focus (Optional)
          </label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Prepare for exam in 3 days, Focus on key definitions..."
            className="w-full p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none h-24"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
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
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header & Progress */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
              Your Study Plan
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--surface-hover)] text-[var(--foreground)] rounded-lg hover:bg-[var(--border)] transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Regenerate
          </button>
        </div>

        {/* Focus Input (Collapsed/Expanded) */}
        {!plan ? null : (
           <div className="mb-4">
             <div className="text-xs font-medium text-[var(--foreground-muted)] mb-1 uppercase tracking-wider">Current Focus</div>
             {/* If we stored the focus in the plan, we could show it. For now, let's keep it simple and just show the input if they want to regenerate with new focus. */}
             <div className="relative">
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Enter study goal to regenerate..."
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] pr-10"
                />
                {focus && (
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="absolute right-1 top-1 bottom-1 px-2 bg-[var(--primary)] text-white text-xs rounded hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50"
                  >
                    Update
                  </button>
                )}
             </div>
           </div>
        )}
        
        {/* Progress Bar */}
        <div className="h-2 bg-[var(--surface-hover)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
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

                    <div className="relative group/menu">
                      {/* Button */}
                      <button className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu with bridging */}
                      <div className="absolute right-0 top-full pt-2 w-48 z-50 hidden group-hover/menu:block">
                         {/* The menu box itself */}
                         <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--surface-hover)] flex items-center gap-2 text-sm text-[var(--foreground)]"
                            >
                              <CheckSquare className="w-4 h-4" />
                              {task.isCompleted ? "Mark Uncomplete" : "Mark Complete"}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onLearn) onLearn(task.task);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--surface-hover)] flex items-center gap-2 text-sm text-[var(--foreground)]"
                            >
                              <BookOpen className="w-4 h-4" />
                              Learn
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onVerify) onVerify(`${task.task} - ${task.description || ''}`);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--surface-hover)] flex items-center gap-2 text-sm text-[var(--foreground)]"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Verify
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onQuiz) onQuiz(task.task);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-[var(--surface-hover)] flex items-center gap-2 text-sm text-[var(--foreground)]"
                            >
                              <HelpCircle className="w-4 h-4" />
                              Quiz
                            </button>
                          </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Modal */}
      {verifyingTask && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setVerifyingTask(null)}
        >
          <div 
            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Verify Understanding?
              </h3>
              <p className="text-sm text-gray-400">
                You're marking <strong className="text-white">"{verifyingTask.task}"</strong> as done. Take a quick quiz first?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleVerifyQuiz}
                className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Take Quick Quiz
              </button>
              
              <button
                onClick={handleVerifySkip}
                className="w-full bg-gray-800 text-white font-medium py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Skip & Mark as Done
              </button>
              
              <button
                onClick={() => setVerifyingTask(null)}
                className="w-full text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
