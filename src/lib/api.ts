// API client for LearnLens Backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper to get auth token
function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("learnlens_token");
}

// Generic fetch wrapper with auth
async function fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
        (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || "Request failed");
    }

    return response.json();
}

// Auth API
export const authAPI = {
    login: async (email: string, password: string) => {
        const result = await fetchAPI<{
            success: boolean;
            user: User;
            token: string;
        }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        if (result.token) {
            localStorage.setItem("learnlens_token", result.token);
        }

        return result;
    },

    register: async (email: string, password: string, name?: string) => {
        const result = await fetchAPI<{
            success: boolean;
            user: User;
            token: string;
        }>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, name }),
        });

        if (result.token) {
            localStorage.setItem("learnlens_token", result.token);
        }

        return result;
    },

    logout: () => {
        localStorage.removeItem("learnlens_token");
        localStorage.removeItem("learnlens_user");
    },

    updateSettings: async (settings: { name?: string; preferredModel?: string; maxTokens?: number }) => {
        return fetchAPI<{ success: boolean; user: User }>("/api/auth/settings", {
            method: "PUT",
            body: JSON.stringify(settings),
        });
    },

    getModels: async () => {
        return fetchAPI<{ success: boolean; models: AIModel[] }>("/api/auth/models");
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
        return fetchAPI<{ success: boolean; message: string }>("/api/auth/change-password", {
            method: "PUT",
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    },

    testCustomApi: async (apiUrl: string, apiKey: string, model: string) => {
        return fetchAPI<{ success: boolean; message?: string; error?: string; model?: string; response?: string }>("/api/auth/test-api", {
            method: "POST",
            body: JSON.stringify({ apiUrl, apiKey, model }),
        });
    },
};

// Materials API
export const materialsAPI = {
    list: () =>
        fetchAPI<{ success: boolean; materials: MaterialSummary[] }>("/api/materials"),

    get: (id: string) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}`),

    create: async (data: {
        title: string;
        content?: string;
        file?: File;
        description?: string;
        type?: string;
    }) => {
        const formData = new FormData();
        formData.append("title", data.title);

        if (data.file) {
            formData.append("file", data.file);
        } else if (data.content) {
            formData.append("content", data.content);
        }

        if (data.description) {
            formData.append("description", data.description);
        }

        if (data.type) {
            formData.append("type", data.type);
        }

        return fetchAPI<{ success: boolean; material: Material }>("/api/materials", {
            method: "POST",
            body: formData,
        });
    },

    generateSummary: (id: string, config?: { model?: string; customText?: string; language?: string; customConfig?: CustomConfig }) =>
        fetchAPI<{ success: boolean; summary: string }>(`/api/materials/${id}/summary`, {
            method: "POST",
            body: JSON.stringify(config || {}),
        }),

    update: (id: string, data: { title?: string; content?: string }) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    parse: async (file: File, smartCleanup = false) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("smartCleanup", smartCleanup.toString());
        return fetchAPI<{ success: boolean; content: string }>("/api/materials/parse", {
            method: "POST",
            body: formData,
        });
    },

    appendFile: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}/append-file`, {
            method: "POST",
            body: formData,
        });
    },

    appendText: (id: string, text: string) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}/append-text`, {
            method: "POST",
            body: JSON.stringify({ text }),
        }),

    delete: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/materials/${id}`, {
            method: "DELETE",
        }),

    deleteSummary: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/materials/${id}/summary`, {
            method: "DELETE",
        }),

    deleteQuizzes: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/materials/${id}/quizzes`, {
            method: "DELETE",
        }),

    deleteMessages: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/materials/${id}/messages`, {
            method: "DELETE",
        }),

    deleteMessage: (materialId: string, messageId: string) =>
        fetchAPI<{ success: boolean }>(`/api/materials/${materialId}/messages/${messageId}`, {
            method: "DELETE",
        }),

    publish: (id: string, data?: { title: string; description: string; content?: string }) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}/publish`, {
            method: "POST",
            body: JSON.stringify(data || {}),
        }),

    unpublish: (id: string) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}/unpublish`, {
            method: "POST",
        }),
};

// Chat API
export const chatAPI = {
    getMessages: (materialId: string) =>
        fetchAPI<{ success: boolean; messages: Message[] }>(`/api/chat/${materialId}`),

    sendMessage: (materialId: string, message: string, language: string = "en") =>
        fetchAPI<{ success: boolean; userMessage: Message; assistantMessage: Message }>(
            `/api/chat/${materialId}`,
            {
                method: "POST",
                body: JSON.stringify({ message, language }),
            }
        ),

    sendMessageStream: async (
        materialId: string,
        message: string,
        onChunk: (chunk: string) => void,
        onUserMessage?: (message: Message) => void,
        onComplete?: (message: Message) => void,
        onError?: (error: string) => void,
        signal?: AbortSignal,
        language: string = "en"
    ) => {
        const token = localStorage.getItem("learnlens_token");

        try {
            const response = await fetch(`${API_URL}/api/chat/${materialId}/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ message, language }),
                signal, // Pass abort signal to fetch
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();

            try {
                while (true) {
                    // Check if aborted
                    if (signal?.aborted) {
                        reader.cancel();
                        break;
                    }

                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split("\n\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === "user_message" && onUserMessage) {
                                    onUserMessage(data.message);
                                } else if (data.type === "chunk") {
                                    onChunk(data.content);
                                } else if (data.type === "done" && onComplete) {
                                    onComplete(data.message);
                                } else if (data.type === "error" && onError) {
                                    onError(data.error);
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error: any) {
            // Don't report error if it was an abort
            if (error.name === 'AbortError') {
                console.log("Stream aborted by user");
                return;
            }
            console.error("Stream error:", error);
            if (onError) {
                onError("Failed to connect to AI service");
            }
            throw error;
        }
    },

    clearHistory: (materialId: string) =>
        fetchAPI<{ success: boolean }>(`/api/chat/${materialId}`, {
            method: "DELETE",
        }),
};

// AI API
export const aiAPI = {
    getConcepts: (materialId: string) =>
        fetchAPI<{ success: boolean; concepts: string }>(`/api/ai/${materialId}/concepts`),

    generateQuiz: (materialId: string, config: {
        count?: number;
        difficulty?: "easy" | "medium" | "hard";
        model?: string;
        materialIds?: string[];
        customText?: string;
        language?: string;
        customConfig?: CustomConfig;
    } = {}) =>
        fetchAPI<{ success: boolean; quizzes: Quiz[] }>(`/api/ai/${materialId}/quiz`, {
            method: "POST",
            body: JSON.stringify(config),
        }),

    getQuizzes: (materialId: string) =>
        fetchAPI<{ success: boolean; quizzes: Quiz[] }>(`/api/ai/${materialId}/quiz`),

    // Glossary
    generateGlossary: (materialId: string, model?: string, language: string = "en", customConfig?: CustomConfig) =>
        fetchAPI<{ success: boolean; glossary: GlossaryTerm[] }>(`/api/ai/${materialId}/glossary`, {
            method: "POST",
            body: JSON.stringify({ model, language, customConfig }),
        }),

    getGlossary: (materialId: string) =>
        fetchAPI<{ success: boolean; glossary: GlossaryTerm[] }>(`/api/ai/${materialId}/glossary`),

    deleteGlossary: (materialId: string) =>
        fetchAPI<{ success: boolean }>(`/api/ai/${materialId}/glossary`, {
            method: "DELETE",
        }),

    addTermToGlossary: (materialId: string, term: string, model?: string) =>
        fetchAPI<{ success: boolean; term: GlossaryTerm; glossary: GlossaryTerm[] }>(`/api/ai/${materialId}/glossary/term`, {
            method: "POST",
            body: JSON.stringify({ term, model }),
        }),

    // Content cleanup - remove unnecessary parts like TOC, list of figures, etc.
    cleanupContent: (materialId: string, content: string) =>
        fetchAPI<{ success: boolean; cleanedContent: string; removedChars: number }>(`/api/ai/${materialId}/cleanup`, {
            method: "POST",
            body: JSON.stringify({ content }),
        }),

    // Flashcards
    generateFlashcards: (materialId: string, count: number = 10, language: string = "en", model?: string, customConfig?: CustomConfig) =>
        fetchAPI<{ success: boolean; flashcards: Flashcard[] }>(`/api/ai/${materialId}/flashcards`, {
            method: "POST",
            body: JSON.stringify({ count, language, model, customConfig }),
        }),

    getFlashcards: (materialId: string) =>
        fetchAPI<{ success: boolean; flashcards: Flashcard[] }>(`/api/ai/${materialId}/flashcards`),

    deleteFlashcards: (materialId: string) =>
        fetchAPI<{ success: boolean }>(`/api/ai/${materialId}/flashcards`, {
            method: "DELETE",
        }),
};

// Types
export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    preferredModel?: string;
    maxTokens?: number;
    maxContext?: number;
    customApiUrl?: string;
    customModel?: string;
    customMaxTokens?: number;
    customMaxContext?: number;
    hasCustomApiKey?: boolean;
}

export interface CustomConfig {
    customApiUrl?: string;
    customApiKey?: string;
    customModel?: string;
    customMaxTokens?: number;
    customMaxContext?: number;
}

export interface AIModel {
    id: string;
    name: string;
    tier?: string;
    price: string;
    description?: string;
    pros?: string[];
    cons?: string[];
}

export interface MaterialSummary {
    id: string;
    title: string;
    type: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        messages: number;
        quizzes: number;
    };
    publishedAt?: string | null;
}

export interface Material {
    id: string;
    title: string;
    content: string;
    type: string;
    summary?: string;
    glossary?: GlossaryTerm[];
    createdAt: string;
    updatedAt: string;
    messages: Message[];
    quizzes: Quiz[];
    isPublic?: boolean;
    publishedAt?: string | null;
    views?: number;
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

export interface Quiz {
    id: string;
    question: string;
    options: string[];
    answer: number;
    hint?: string;
    createdAt: string;
}

export interface GlossaryTerm {
    term: string;
    definition: string;
    category?: string;
}

export interface Flashcard {
    front: string;
    back: string;
    category?: string;
}

// Analytics Types
export interface StudySession {
    id: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    materialId: string;
    createdAt: string;
}

export interface QuizAttempt {
    id: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    materialId: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

export interface MaterialAnalytics {
    chatActivity: {
        totalQuestions: number;
        lastActivity: string | null;
        recentMessages: ChatMessage[];
    };
    quizPerformance: {
        totalAttempts: number;
        averageScore: number;
        bestScore: number;
        recentAttempts: QuizAttempt[];
    };
}

// Learning Evaluation interface
export interface LearningEvaluation {
    id: string;
    content: string;
    score: number;
    questionsCount: number;
    quizAvgScore: number | null;
    createdAt: string;
}

// Analytics API
export const analyticsAPI = {
    saveQuizAttempt: (materialId: string, score: number, totalQuestions: number) =>
        fetchAPI<{ success: boolean; attempt: QuizAttempt }>("/api/analytics/quiz-attempt", {
            method: "POST",
            body: JSON.stringify({ materialId, score, totalQuestions }),
        }),

    getMaterialAnalytics: (materialId: string) =>
        fetchAPI<{ success: boolean; analytics: MaterialAnalytics }>(`/api/analytics/material/${materialId}`),

    evaluateLearning: (materialId: string, language: string = "en") =>
        fetchAPI<{ success: boolean; evaluation: LearningEvaluation }>(`/api/analytics/evaluate/${materialId}`, {
            method: "POST",
            body: JSON.stringify({ language }),
        }),

    deleteEvaluations: (materialId: string) =>
        fetchAPI<{ success: boolean }>(`/api/analytics/evaluations/${materialId}`, {
            method: "DELETE",
        }),

    getEvaluations: (materialId: string) =>
        fetchAPI<{ success: boolean; evaluations: LearningEvaluation[] }>(`/api/analytics/evaluations/${materialId}`),
};

// Chat Sessions Types
export interface ChatSessionMaterial {
    id: string;
    title: string;
    type: string;
}

export interface ChatSessionMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    materials: ChatSessionMaterial[];
    messageCount: number;
}

export interface ChatSessionDetail extends ChatSession {
    messages: ChatSessionMessage[];
}

// Chat Sessions API
export const chatSessionsAPI = {
    list: () =>
        fetchAPI<{ success: boolean; chatSessions: ChatSession[] }>("/api/chat-sessions"),

    get: (id: string) =>
        fetchAPI<{ success: boolean; chatSession: ChatSessionDetail }>(`/api/chat-sessions/${id}`),

    create: (materialIds: string[], title?: string) =>
        fetchAPI<{ success: boolean; chatSession: ChatSession }>("/api/chat-sessions", {
            method: "POST",
            body: JSON.stringify({ materialIds, title }),
        }),

    delete: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/chat-sessions/${id}`, {
            method: "DELETE",
        }),

    clearMessages: (id: string) =>
        fetchAPI<{ success: boolean }>(`/api/chat-sessions/${id}/messages`, {
            method: "DELETE",
        }),

    sendMessageStream: async (
        sessionId: string,
        message: string,
        onChunk: (chunk: string) => void,
        onUserMessage?: (message: ChatSessionMessage) => void,
        onComplete?: (message: ChatSessionMessage) => void,
        onError?: (error: string) => void,
        signal?: AbortSignal,
        language: string = "en"
    ) => {
        const token = localStorage.getItem("learnlens_token");

        try {
            const response = await fetch(`${API_URL}/api/chat-sessions/${sessionId}/stream`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ message, language }),
                signal,
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("No response body");
            }

            const decoder = new TextDecoder();

            try {
                while (true) {
                    if (signal?.aborted) {
                        reader.cancel();
                        break;
                    }

                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value);
                    const lines = text.split("\n\n");

                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === "user_message" && onUserMessage) {
                                    onUserMessage(data.message);
                                } else if (data.type === "chunk") {
                                    onChunk(data.content);
                                } else if (data.type === "done" && onComplete) {
                                    onComplete(data.message);
                                } else if (data.type === "error" && onError) {
                                    onError(data.error);
                                }
                            } catch {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream aborted by user");
                return;
            }
            console.error("Stream error:", error);
            if (onError) {
                onError("Failed to connect to AI service");
            }
            throw error;
        }
    },
};

// Explore API
export interface ExploreComment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

export interface ExploreMaterial extends MaterialSummary {
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
    originalMaterialId?: string | null;
    isLiked: boolean;
    isDisliked: boolean;
    likeCount: number;
    dislikeCount: number;
    commentCount: number;
    forkCount: number;
    description?: string;
    isPublic?: boolean;
}

export const exploreAPI = {
    list: (sort: 'popular' | 'latest' = 'latest', query?: string, userId?: string) =>
        fetchAPI<{ success: boolean; materials: ExploreMaterial[] }>(`/api/explore?sort=${sort}${query ? `&query=${encodeURIComponent(query)}` : ''}${userId ? `&userId=${userId}` : ''}`),

    get: (id: string) =>
        fetchAPI<{ success: boolean; material: ExploreMaterial & Material }>(`/api/explore/${id}`),

    toggleLike: (id: string) =>
        fetchAPI<{ success: boolean; liked: boolean }>(`/api/explore/${id}/like`, { method: "POST" }),

    toggleDislike: (id: string) =>
        fetchAPI<{ success: boolean; disliked: boolean }>(`/api/explore/${id}/dislike`, { method: "POST" }),

    getComments: (id: string) =>
        fetchAPI<{ success: boolean; comments: ExploreComment[] }>(`/api/explore/${id}/comments`),

    addComment: (id: string, content: string) =>
        fetchAPI<{ success: boolean; comment: ExploreComment }>(`/api/explore/${id}/comments`, {
            method: "POST",
            body: JSON.stringify({ content })
        }),

    deleteComment: (commentId: string) =>
        fetchAPI<{ success: boolean }>(`/api/explore/comments/${commentId}`, { method: "DELETE" }),

    fork: (id: string) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/explore/${id}/fork`, { method: "POST" }),
};
