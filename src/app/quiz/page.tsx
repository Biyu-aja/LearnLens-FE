"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  HelpCircle, 
  Sparkles, 
  Check,
  Play,
  FileText,
  Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { MaterialUpload } from "@/components/MaterialUpload";
import { SettingsModal } from "@/components/SettingsModal";
import { QuizCard } from "@/components/QuizPanel";
import { materialsAPI, aiAPI, authAPI, analyticsAPI, MaterialSummary, Quiz, AIModel } from "@/lib/api";

// Supported AI languages
const AI_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "id", label: "Indonesian", flag: "🇮🇩" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "pt", label: "Portuguese", flag: "🇵🇹" },
  { id: "zh", label: "Chinese", flag: "🇨🇳" },
  { id: "ja", label: "Japanese", flag: "🇯🇵" },
  { id: "ko", label: "Korean", flag: "🇰🇷" },
  { id: "ar", label: "Arabic", flag: "🇸🇦" },
] as const;

type AILanguage = typeof AI_LANGUAGES[number]["id"];

type QuizConfig = {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  model: string;
  language: AILanguage;
};

export default function QuizPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Selection state
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [showCustomText, setShowCustomText] = useState(false);

  // Config state
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 10,
    difficulty: "medium",
    model: "gemini-3-flash", // default fallback
    language: "en",
  });


  // Quiz state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false); // To keep track if results are shown (though submitted also implies it)

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch data & init config
  useEffect(() => {
    if (user) {
      loadData();
      
      // Init model with fixed default
      setConfig(prev => ({ 
        ...prev, 
        model: "gemini-3-flash" 
      }));
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [materialsRes, modelsRes] = await Promise.all([
        materialsAPI.list(),
        authAPI.getModels(),
      ]);
      setMaterials(materialsRes.materials);
      setModels(modelsRes.models);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedMaterials(materials.map((m) => m.id));
  };

  const selectNone = () => {
    setSelectedMaterials([]);
  };

  // Quiz Logic
  const score = quizzes.reduce((acc, quiz) => {
    return acc + (answers[quiz.id] === quiz.answer ? 1 : 0);
  }, 0);
  const total = quizzes.length;

  const handleSelect = (quizId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [quizId]: optionIndex }));
  };

  const toggleHint = (quizId: string) => {
    setHints(prev => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setShowResults(true);
    
    // Save quiz attempt to analytics for each selected material
    for (const materialId of selectedMaterials) {
      try {
        await analyticsAPI.saveQuizAttempt(materialId, score, total);
        console.log(`Quiz attempt saved for material ${materialId}`);
      } catch (error) {
        console.error(`Failed to save quiz attempt for material ${materialId}:`, error);
      }
    }
  };

  const handleReset = () => {
    setAnswers({});
    setHints({});
    setSubmitted(false);
    setShowResults(false);
  };

  const handleGenerateQuiz = async () => {
    if (selectedMaterials.length === 0 && !customText.trim()) {
      alert("Please select at least one material or add custom text.");
      return;
    }

    setIsGenerating(true);
    setQuizzes([]);
    handleReset();

    try {
      // Use the first selected material as the primary ID for the API route
      const primaryMaterialId = selectedMaterials[0] || materials[0]?.id;
      // Note: If no materials (only custom text) and no materials exist at all, this might fail.
      // But user usually has materials if they are here, or uploaded one.
      // If purely custom text without ANY material record in DB, we still need a material ID for the route /api/ai/:id/quiz
      // This is a limitation of current route design. We assume at least one material exists.
      
      if (!primaryMaterialId) {
        alert("Please upload at least one material first to use as a context anchor.");
        return;
      }

      const response = await aiAPI.generateQuiz(primaryMaterialId, {
        count: config.questionCount,
        difficulty: config.difficulty,
        model: "gemini-3-flash",
        materialIds: selectedMaterials,
        customText: customText.trim(),
        language: config.language
      });
      setQuizzes(response.quizzes);
    } catch (error) {
      console.error("Failed to generate quiz:", error);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (data: { 
    title: string; 
    content?: string; 
    files?: File[]; 
    description?: string;
    type: "file" | "text" | "research";
    smartCleanup?: boolean 
  }) => {
    // Research mode - create and redirect
    if (data.type === "research") {
      const response = await materialsAPI.create({
        title: data.title,
        type: "research"
      });
      await loadData();
      setSelectedMaterials(prev => [...prev, response.material.id]);
      return;
    }
    // File mode - parse and combine multiple files
    else if (data.files && data.files.length > 0) {
      let combinedContent = "";
      let fileType = "text";
      
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        
        if (i === 0) {
          if (file.type === "application/pdf") fileType = "pdf";
          else if (file.type.includes("word")) fileType = "docx";
          else if (file.type === "text/markdown") fileType = "markdown";
        }
        
        const parsed = await materialsAPI.parse(file, data.smartCleanup || false);
        if (combinedContent && parsed.content) {
          combinedContent += `\n\n--- ${file.name} ---\n\n`;
        }
        combinedContent += parsed.content;
      }
      
      const response = await materialsAPI.create({ 
        title: data.title, 
        content: combinedContent,
        type: fileType
      });
      await loadData();
      setSelectedMaterials(prev => [...prev, response.material.id]);
    } 
    // Text mode
    else if (data.content) {
      const response = await materialsAPI.create({
        title: data.title,
        content: data.content,
        type: "text"
      });
      await loadData();
      setSelectedMaterials(prev => [...prev, response.material.id]);
    }
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  const questionOptions = [5, 10, 15, 20, 25, 30];
  const difficultyOptions = [
    { value: "easy" as const, label: "Easy", desc: "Basic recall" },
    { value: "medium" as const, label: "Medium", desc: "Understanding" },
    { value: "hard" as const, label: "Hard", desc: "Analysis" },
  ];

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        materials={materials} 
        onNewMaterial={() => setShowUpload(true)}
      />

      <main className="flex-1 lg:ml-72">
        <div className="h-screen flex flex-col bg-[var(--background)]">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <HelpCircle size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Quiz Generator</h1>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Create quizzes from your materials
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {quizzes.length === 0 ? (
              // Configuration View
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Material Selection */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-[var(--primary)]" />
                      <h2 className="text-lg font-semibold">Select Materials</h2>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button onClick={selectAll} className="text-[var(--primary)] hover:underline">
                        Select All
                      </button>
                      <span className="text-[var(--foreground-muted)]">|</span>
                      <button onClick={selectNone} className="text-[var(--foreground-muted)] hover:underline">
                        Clear
                      </button>
                    </div>
                  </div>

                  {materials.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText size={40} className="mx-auto text-[var(--foreground-muted)] mb-3" />
                      <p className="text-[var(--foreground-muted)] mb-4">No materials yet</p>
                      <button
                        onClick={() => setShowUpload(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]"
                      >
                        <Plus size={16} />
                        Upload Material
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {materials.map((material) => (
                        <button
                          key={material.id}
                          onClick={() => toggleMaterial(material.id)}
                          className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all border-2 ${
                            selectedMaterials.includes(material.id)
                              ? "border-[var(--primary)] bg-[var(--primary-light)]"
                              : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--background)]"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                            selectedMaterials.includes(material.id)
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface)] border border-[var(--border)]"
                          }`}>
                            {selectedMaterials.includes(material.id) && <Check size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{material.title}</p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                              {material.type.toUpperCase()} • {new Date(material.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom Text */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <button
                      onClick={() => setShowCustomText(!showCustomText)}
                      className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
                    >
                      <Plus size={14} />
                      {showCustomText ? "Hide custom text" : "Add custom topic/content"}
                    </button>
                    {showCustomText && (
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Add additional topics or content for the quiz..."
                        className="mt-3 w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                        rows={3}
                      />
                    )}
                  </div>

                  <p className="text-sm text-[var(--foreground-muted)] mt-4">
                    {selectedMaterials.length} material(s) selected
                  </p>
                </div>

                {/* Quiz Configuration */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold">Quiz Settings</h2>
                  </div>

                  {/* Questions */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Number of Questions</label>
                    <div className="flex flex-wrap gap-2">
                      {questionOptions.map((count) => (
                        <button
                          key={count}
                          onClick={() => setConfig(prev => ({ ...prev, questionCount: count }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            config.questionCount === count
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {difficultyOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setConfig(prev => ({ ...prev, difficulty: opt.value }))}
                          className={`p-3 rounded-xl text-center transition-all ${
                            config.difficulty === opt.value
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className={`text-xs ${config.difficulty === opt.value ? "text-white/80" : "text-[var(--foreground-muted)]"}`}>
                            {opt.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>


                  {/* Language */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Quiz Language</label>
                    <div className="grid grid-cols-5 gap-2">
                      {AI_LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setConfig(prev => ({ ...prev, language: lang.id }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                            config.language === lang.id
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span className="text-xs">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || (selectedMaterials.length === 0 && !customText.trim())}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg shadow-purple-500/25"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Play size={24} />
                      Generate Quiz ({config.questionCount} questions)
                    </>
                  )}
                </button>
              </div>
            ) : (
              // Quiz View
              <div className="max-w-3xl mx-auto">
                {/* Quiz Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">Your Quiz</h2>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {quizzes.length} questions • {config.difficulty} difficulty
                    </p>
                  </div>
                  <button
                    onClick={() => setQuizzes([])}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)] text-sm"
                  >
                    ← Back to Settings
                  </button>
                </div>

                {/* Score */}
                {submitted && (
                  <div className={`p-6 rounded-2xl mb-6 ${
                    score / total >= 0.7
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                  }`}>
                    <h3 className="text-xl font-bold mb-2">
                      {score / total >= 0.7 ? "🎉 Great Job!" : "📚 Keep Studying!"}
                    </h3>
                    <p className="text-[var(--foreground-muted)]">
                      You scored {score} out of {total} (
                      {Math.round((score / total) * 100)}%)
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)]"
                      >
                        Retry Quiz
                      </button>
                      <button
                        onClick={() => setQuizzes([])}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-hover)]"
                      >
                        New Quiz
                      </button>
                    </div>
                  </div>
                )}

                {/* Quiz Cards */}
                <div className="space-y-4">
                  {quizzes.map((quiz, index) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      index={index}
                      selectedAnswer={answers[quiz.id] ?? null}
                      revealed={submitted}
                      showHint={hints[quiz.id] ?? false}
                      onSelect={(optionIndex) => handleSelect(quiz.id, optionIndex)}
                      onToggleHint={() => toggleHint(quiz.id)}
                    />
                  ))}
                </div>
                
                {!submitted && quizzes.length > 0 && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length !== quizzes.length}
                            className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-hover)] font-semibold shadow-lg transition-all"
                        >
                            Submit Quiz
                        </button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Upload modal */}
      {showUpload && (
        <MaterialUpload
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Settings modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
