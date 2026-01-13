"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, 
  Plus, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  FileText,
  Sparkles,
  Settings,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MaterialSummary } from "@/lib/api";
import { SettingsModal } from "./SettingsModal";

interface SidebarProps {
  materials: MaterialSummary[];
  onNewMaterial: () => void;
}

export function Sidebar({ materials, onNewMaterial }: SidebarProps) {
  const { user, logout, updateUser } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleModelChange = (model: string) => {
    if (user) {
      updateUser({ ...user, preferredModel: model });
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--sidebar-bg)] text-white lg:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--sidebar-hover)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">LearnLens</h1>
              <p className="text-xs text-[var(--sidebar-text-muted)]">AI Tutoring</p>
            </div>
          </Link>
        </div>

        {/* New Material Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewMaterial();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            New Material
          </button>
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-xs font-medium text-[var(--sidebar-text-muted)] uppercase tracking-wider mb-3">
            Your Materials
          </p>
          
          {materials.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-[var(--sidebar-text-muted)] mb-3" />
              <p className="text-sm text-[var(--sidebar-text-muted)]">
                No materials yet
              </p>
              <p className="text-xs text-[var(--sidebar-text-muted)] mt-1">
                Upload your first learning material
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {materials.map((material) => {
                const isActive = pathname === `/material/${material.id}`;
                return (
                  <li key={material.id}>
                    <Link
                      href={`/material/${material.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? "bg-[var(--sidebar-active)] text-white" 
                          : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)]"
                      }`}
                    >
                      <FileText size={16} className="shrink-0" />
                      <span className="flex-1 truncate text-sm">
                        {material.title}
                      </span>
                      <ChevronRight 
                        size={14} 
                        className={`shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive ? "opacity-100" : ""
                        }`} 
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quiz Link */}
        <div className="px-4 py-2">
          <Link
            href="/quiz"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              pathname === "/quiz"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)]"
            }`}
          >
            <HelpCircle size={16} className="shrink-0" />
            <span className="flex-1 text-sm font-medium">Quiz Generator</span>
            <ChevronRight 
              size={14} 
              className={`shrink-0 ${pathname === "/quiz" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} 
            />
          </Link>
        </div>

        {/* Settings Link */}
        <div className="px-4 py-2">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              pathname === "/settings"
                ? "bg-[var(--sidebar-active)] text-white"
                : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)]"
            }`}
          >
            <Settings size={16} className="shrink-0" />
            <span className="flex-1 text-sm font-medium">Settings</span>
            <ChevronRight 
              size={14} 
              className={`shrink-0 ${pathname === "/settings" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} 
            />
          </Link>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-[var(--sidebar-hover)]">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name || "User"} 
                className="w-9 h-9 rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-[var(--sidebar-text-muted)] truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)] hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Settings Modal - Kept for potential future use or removed if fully moved */}
    </>
  );
}
