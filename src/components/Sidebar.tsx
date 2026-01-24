"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Plus, 
  LogOut, 
  Menu, 
  X, 
  FileText,
  Sparkles,
  Settings,
  HelpCircle,
  Globe,
  LayoutDashboard,
  Search,
  Book
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MaterialSummary } from "@/lib/api";

interface SidebarProps {
  materials: MaterialSummary[];
  onNewMaterial: () => void;
}

export function Sidebar({ materials, onNewMaterial }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Explore", href: "/explore", icon: Globe },
    { title: "Quiz Generator", href: "/quiz", icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--sidebar-bg)] text-white lg:hidden border border-[var(--sidebar-hover)]"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] flex flex-col z-50 transform transition-transform duration-300 lg:translate-x-0 border-r border-[var(--sidebar-hover)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">LearnLens</h1>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sidebar-text-muted)] font-medium">AI Teaching Assistant</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="px-3 py-2">
          <p className="px-4 text-xs font-semibold text-[var(--sidebar-text-muted)] uppercase tracking-wider mb-2">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? "bg-[var(--sidebar-active)] text-white font-medium border-l-4 border-indigo-500 rounded-l-sm" 
                        : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)] hover:text-white"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-indigo-400" : "group-hover:text-white transition-colors"} />
                    <span>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Library Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 mt-2">
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-xs font-semibold text-[var(--sidebar-text-muted)] uppercase tracking-wider">
              Library
            </p>
            <button 
              onClick={() => {
                onNewMaterial();
                setIsOpen(false);
              }}
              className="p-1 hover:bg-[var(--sidebar-hover)] rounded-md text-[var(--sidebar-text-muted)] hover:text-white transition-colors"
              title="New Material"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="mb-2 px-2">
             <button
                onClick={() => {
                  onNewMaterial();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--sidebar-hover)] hover:border-indigo-500/50 hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)] hover:text-white transition-all text-sm group"
              >
                <div className="w-6 h-6 rounded-md bg-[var(--sidebar-active)] flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                  <Plus size={14} />
                </div>
                <span>Create New</span>
              </button>
          </div>
          
          {materials.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center mx-auto mb-3 opacity-50">
                <Book size={20} className="text-[var(--sidebar-text-muted)]" />
              </div>
              <p className="text-xs text-[var(--sidebar-text-muted)]">
                Your library is empty
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {materials.map((material) => {
                const isActive = pathname === `/material/${material.id}`;
                return (
                  <li key={material.id}>
                    <Link
                      href={`/material/${material.id}`}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                        isActive 
                          ? "bg-[var(--sidebar-active)] text-white" 
                          : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)] hover:text-white"
                      }`}
                    > 
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />
                      )}
                      <FileText size={16} className={`shrink-0 ${isActive ? "text-indigo-400" : "opacity-70"}`} />
                      <span className="flex-1 truncate text-sm">
                        {material.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-3 pb-3">
           <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mb-2 ${
                pathname === "/settings"
                  ? "bg-[var(--sidebar-active)] text-white"
                  : "hover:bg-[var(--sidebar-hover)] text-[var(--sidebar-text-muted)] hover:text-white"
              }`}
            >
              <Settings size={18} />
              <span className="text-sm font-medium">Settings</span>
            </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--sidebar-hover)] bg-[var(--sidebar-bg)]">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--sidebar-hover)] transition-colors group cursor-pointer">
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name || "User"} 
                className="w-9 h-9 rounded-full border border-[var(--sidebar-active)]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{user?.name}</p>
              <p className="text-[10px] text-[var(--sidebar-text-muted)] truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--sidebar-active)] text-[var(--sidebar-text-muted)] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
