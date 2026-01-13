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
};

// Materials API
export const materialsAPI = {
    list: () =>
        fetchAPI<{ success: boolean; materials: MaterialSummary[] }>("/api/materials"),

    get: (id: string) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}`),

    create: async (data: { title: string; content?: string; file?: File }) => {
        const formData = new FormData();
        formData.append("title", data.title);

        if (data.file) {
            formData.append("file", data.file);
        } else if (data.content) {
            formData.append("content", data.content);
        }

        return fetchAPI<{ success: boolean; material: Material }>("/api/materials", {
            method: "POST",
            body: formData,
        });
    },

    generateSummary: (id: string) =>
        fetchAPI<{ success: boolean; summary: string }>(`/api/materials/${id}/summary`, {
            method: "POST",
        }),

    update: (id: string, data: { title?: string; content?: string }) =>
        fetchAPI<{ success: boolean; material: Material }>(`/api/materials/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    parse: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return fetchAPI<{ success: boolean; content: string }>("/api/materials/parse", {
            method: "POST",
            body: formData,
        });
    },

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
};

// Chat API
export const chatAPI = {
    getMessages: (materialId: string) =>
        fetchAPI<{ success: boolean; messages: Message[] }>(`/api/chat/${materialId}`),

    sendMessage: (materialId: string, message: string) =>
        fetchAPI<{ success: boolean; userMessage: Message; assistantMessage: Message }>(
            `/api/chat/${materialId}`,
            {
                method: "POST",
                body: JSON.stringify({ message }),
            }
        ),

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
    } = {}) =>
        fetchAPI<{ success: boolean; quizzes: Quiz[] }>(`/api/ai/${materialId}/quiz`, {
            method: "POST",
            body: JSON.stringify(config),
        }),

    getQuizzes: (materialId: string) =>
        fetchAPI<{ success: boolean; quizzes: Quiz[] }>(`/api/ai/${materialId}/quiz`),

    // Glossary
    generateGlossary: (materialId: string, model?: string) =>
        fetchAPI<{ success: boolean; glossary: GlossaryTerm[] }>(`/api/ai/${materialId}/glossary`, {
            method: "POST",
            body: JSON.stringify({ model }),
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
};

// Types
export interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    preferredModel?: string;
    maxTokens?: number;
}

export interface AIModel {
    id: string;
    name: string;
    tier: "flash" | "standard" | "pro" | "thinking" | "premium";
    price: string;
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
    createdAt: string;
}

export interface GlossaryTerm {
    term: string;
    definition: string;
    category?: string;
}
