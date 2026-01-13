"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Globe, 
  Bell, 
  Palette, 
  LogOut, 
  Loader2, 
  Check,
  Mail,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Sidebar } from "@/components/Sidebar";
import { MaterialUpload } from "@/components/MaterialUpload";
import { materialsAPI, authAPI, MaterialSummary } from "@/lib/api";

type Theme = "light" | "dark" | "system";
type Language = "id" | "en";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, logout, updateUser } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Local settings state (for editing before save)
  const [localSettings, setLocalSettings] = useState(settings);

  // Separate state for display name (editable)
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchMaterials();
      setDisplayName(user.name || "");
    }
  }, [user]);

  // Sync local settings when global settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.list();
      setMaterials(response.materials);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  };

  const handleUpload = async (data: { title: string; content?: string; file?: File }) => {
    const response = await materialsAPI.create(data);
    await fetchMaterials();
    router.push(`/material/${response.material.id}`);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      // Apply settings globally
      updateSettings(localSettings);
      
      // Save name to backend if changed
      if (displayName !== user?.name) {
        const { user: updatedUser } = await authAPI.updateSettings({ 
          ...user,
          name: displayName 
        });
        updateUser(updatedUser);
      }
      
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveMessage("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout();
      router.push("/");
    }
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "language", label: "Language", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar 
        materials={materials}
        onNewMaterial={() => setShowUpload(true)}
      />
      
      <main className="md:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Settings</h1>
                <p className="text-sm text-[var(--foreground-muted)]">Manage your account and preferences</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row">
          {/* Settings Navigation */}
          <nav className="lg:w-64 border-b lg:border-b-0 lg:border-r border-[var(--border)] p-4">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "hover:bg-[var(--surface-hover)] text-[var(--foreground-muted)]"
                  }`}
                >
                  <section.icon size={18} />
                  <span className="font-medium text-sm">{section.label}</span>
                </button>
              ))}

              <div className="hidden lg:block mt-4 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Settings Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl">
            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Account</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Manage your account information</p>
                </div>

                <div className="space-y-4">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.name || "User"}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">{user.email}</p>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Your display name"
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full px-4 py-2.5 mt-2 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg text-[var(--foreground-muted)] cursor-not-allowed"
                    />
                    <p className="text-xs text-[var(--foreground-muted)] mt-2">
                      Email cannot be changed as it's linked to your Google account
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Customize how LearnLens looks</p>
                </div>

                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <label className="block text-sm font-medium mb-4">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light" as Theme, label: "Light", icon: Sun },
                      { id: "dark" as Theme, label: "Dark", icon: Moon },
                      { id: "system" as Theme, label: "System", icon: Monitor },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setLocalSettings({ ...localSettings, theme: theme.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          localSettings.theme === theme.id
                            ? "border-[var(--primary)] bg-[var(--primary-light)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]"
                        }`}
                      >
                        <theme.icon size={24} className={localSettings.theme === theme.id ? "text-[var(--primary)]" : ""} />
                        <span className="text-sm font-medium">{theme.label}</span>
                        {localSettings.theme === theme.id && (
                          <Check size={16} className="text-[var(--primary)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Language Section */}
            {activeSection === "language" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Language</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Choose your preferred language</p>
                </div>

                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <label className="block text-sm font-medium mb-4">Interface Language</label>
                  <div className="space-y-2">
                    {[
                      { id: "id" as Language, label: "Bahasa Indonesia", flag: "🇮🇩" },
                      { id: "en" as Language, label: "English", flag: "🇺🇸" },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setLocalSettings({ ...localSettings, language: lang.id })}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          localSettings.language === lang.id
                            ? "border-[var(--primary)] bg-[var(--primary-light)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{lang.flag}</span>
                          <span className="font-medium">{lang.label}</span>
                        </div>
                        {localSettings.language === lang.id && (
                          <Check size={20} className="text-[var(--primary)]" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-4">
                    Note: AI responses will adapt to your material's language automatically
                  </p>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Notifications</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Manage notification preferences</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <Mail size={20} className="text-[var(--foreground-muted)]" />
                      <div>
                        <p className="font-medium text-sm">Email Notifications</p>
                        <p className="text-xs text-[var(--foreground-muted)]">Receive updates via email</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLocalSettings({ ...localSettings, emailNotifications: !localSettings.emailNotifications })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localSettings.emailNotifications ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        localSettings.emailNotifications ? "translate-x-7" : "translate-x-1"
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-[var(--foreground-muted)]" />
                      <div>
                        <p className="font-medium text-sm">Sound Effects</p>
                        <p className="text-xs text-[var(--foreground-muted)]">Play sounds for notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setLocalSettings({ ...localSettings, soundEnabled: !localSettings.soundEnabled })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        localSettings.soundEnabled ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        localSettings.soundEnabled ? "translate-x-7" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Changes
                  </>
                )}
              </button>
              {saveMessage && (
                <span className={`text-sm ${saveMessage.includes("success") ? "text-green-500" : "text-red-500"}`}>
                  {saveMessage}
                </span>
              )}
            </div>

            {/* Mobile Logout */}
            <div className="lg:hidden mt-8 pt-6 border-t border-[var(--border)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-500 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upload modal */}
      {showUpload && (
        <MaterialUpload
          isOpen={showUpload}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
