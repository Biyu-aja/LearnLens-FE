"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Settings, 
  User, 
  Palette, 
  LogOut, 
  Loader2, 
  Check,
  Mail,
  Moon,
  Sun,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Sidebar } from "@/components/Sidebar";
import { MaterialUpload } from "@/components/MaterialUpload";
import { materialsAPI, authAPI, MaterialSummary } from "@/lib/api";

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

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  const handleUpload = async (data: { 
    title: string; 
    content?: string; 
    files?: File[]; 
    description?: string;
    type: "file" | "text" | "research";
    smartCleanup?: boolean 
  }) => {
    // Research mode
    if (data.type === "research") {
      const response = await materialsAPI.create({
        title: data.title,
        type: "research"
      });
      router.push(`/material/${response.material.id}`);
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
      await fetchMaterials();
      router.push(`/material/${response.material.id}`);
    } 
    // Text mode
    else if (data.content) {
      const response = await materialsAPI.create({
        title: data.title,
        content: data.content,
        type: "text"
      });
      await fetchMaterials();
      router.push(`/material/${response.material.id}`);
    }
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

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
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
    { id: "security", label: "Security", icon: Lock },
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
                      Email cannot be changed
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4">
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
              </div>
            )}

            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Customize how LearnLens looks</p>
                </div>

                {/* Chat Theme Selector */}
                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <label className="block text-sm font-medium mb-4">Chat Style</label>
                  <div className="space-y-3">
                    {[
                      { 
                        id: "modern" as const, 
                        label: "Modern", 
                        description: "Premium bubbles with avatars",
                        preview: (
                          <div className="flex flex-col gap-1.5 p-1.5">
                            <div className="flex items-end gap-1 justify-end">
                              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-lg rounded-br-sm shadow-sm">Hi there!</div>
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0"></div>
                            </div>
                            <div className="flex items-end gap-1 justify-start">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shrink-0"></div>
                              <div className="bg-[var(--surface-hover)] text-[9px] px-1.5 py-0.5 rounded-lg rounded-bl-sm border border-[var(--border)] shadow-sm">Hello!</div>
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: "classic" as const, 
                        label: "Classic", 
                        description: "Traditional flat style like forums",
                        preview: (
                          <div className="flex flex-col gap-1 p-2">
                            <div className="border-l-2 border-[var(--primary)] pl-2">
                              <div className="text-[8px] text-[var(--primary)] font-medium">You</div>
                              <div className="text-[10px]">Hi there!</div>
                            </div>
                            <div className="border-l-2 border-emerald-500 pl-2">
                              <div className="text-[8px] text-emerald-500 font-medium">AI</div>
                              <div className="text-[10px]">Hello! How can I help?</div>
                            </div>
                          </div>
                        )
                      },
                      { 
                        id: "minimal" as const, 
                        label: "Minimal", 
                        description: "Clean and compact, focus on text",
                        preview: (
                          <div className="flex flex-col gap-1 p-2">
                            <div className="flex gap-2 items-start">
                              <span className="text-[8px] text-[var(--primary)] font-bold shrink-0">You:</span>
                              <span className="text-[10px]">Hi there!</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-[8px] text-emerald-500 font-bold shrink-0">AI:</span>
                              <span className="text-[10px]">Hello! How can I help?</span>
                            </div>
                          </div>
                        )
                      },
                    ].map((chatTheme) => (
                      <button
                        key={chatTheme.id}
                        onClick={() => {
                          setLocalSettings({ ...localSettings, chatTheme: chatTheme.id });
                          updateSettings({ chatTheme: chatTheme.id });
                        }}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          localSettings.chatTheme === chatTheme.id
                            ? "border-[var(--primary)] bg-[var(--primary-light)]"
                            : "border-[var(--border)] hover:border-[var(--primary)]"
                        }`}
                      >
                        {/* Preview */}
                        <div className="w-28 h-16 bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden shrink-0">
                          {chatTheme.preview}
                        </div>
                        {/* Text */}
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{chatTheme.label}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{chatTheme.description}</p>
                        </div>
                        {localSettings.chatTheme === chatTheme.id && (
                          <Check size={20} className="text-[var(--primary)] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] mt-4">
                    Changes how chat messages are displayed
                  </p>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Security</h2>
                  <p className="text-sm text-[var(--foreground-muted)]">Manage your password and security settings</p>
                </div>

                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound size={18} className="text-[var(--foreground-muted)]" />
                    <label className="text-sm font-medium">Change Password</label>
                  </div>

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          placeholder="Min. 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Error/Success Messages */}
                    {passwordError && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        {passwordError}
                      </p>
                    )}
                    {passwordMessage && (
                      <p className="text-sm text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                        {passwordMessage}
                      </p>
                    )}

                    {/* Change Password Button */}
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors font-medium"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
