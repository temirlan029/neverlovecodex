"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/members", label: "Участники" },
  { href: "/shame", label: "Доска позора" },
  { href: "/maps", label: "Карты" },
  { href: "/tactics", label: "Тактики" },
  { href: "/training", label: "Training" },
  { href: "/stats", label: "Статистика" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, loading, login, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileOpen(false);
      setUserMenuOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-xl border-b border-surface-border transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(17, 17, 24, 0.9)" : "rgba(17, 17, 24, 0.8)",
        boxShadow: scrolled ? "0 10px 15px -3px rgba(26, 10, 46, 0.1)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/logo.png"
              alt="NeverLove"
              width={40}
              height={40}
              className="rounded-lg group-hover:scale-110 transition-transform duration-300"
              unoptimized
            />
            <span className="text-xl font-bold text-purple-400 text-glow hidden sm:block">
              NeverLove
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600/20 text-purple-400 glow-purple-sm"
                      : "text-gray-400 hover:text-purple-300 hover:bg-purple-600/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Auth section */}
          <div className="hidden md:block">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-surface-light animate-pulse" />
            ) : user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-light transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-8 h-8 rounded-full ring-2 ring-purple-600/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName[0]}
                    </div>
                  )}
                  <span className="text-sm text-gray-300 max-w-24 truncate">
                    {user.displayName}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-border rounded-xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-border">
                      <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-surface-light transition-colors"
                    >
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={login}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105"
              >
                Войти через Discord
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-purple-400 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                className="transition-all"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={menuRef}
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: mobileOpen ? `${(navLinks.length + 1) * 48 + 32}px` : "0",
          opacity: mobileOpen ? 1 : 0,
        }}
      >
        <div className="border-t border-surface-border bg-surface/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-gray-400 hover:text-purple-300 hover:bg-purple-600/10"
                  }`}
                  style={{
                    transitionDelay: mobileOpen ? `${i * 30}ms` : "0ms",
                    transform: mobileOpen ? "translateX(0)" : "translateX(-10px)",
                    opacity: mobileOpen ? 1 : 0,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
            {user ? (
              <div
                className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-surface-light"
                style={{
                  transitionDelay: mobileOpen ? `${navLinks.length * 30}ms` : "0ms",
                  opacity: mobileOpen ? 1 : 0,
                }}
              >
                <div className="flex items-center gap-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.displayName[0]}
                    </div>
                  )}
                  <span className="text-sm text-gray-300">{user.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                style={{
                  transitionDelay: mobileOpen ? `${navLinks.length * 30}ms` : "0ms",
                  opacity: mobileOpen ? 1 : 0,
                }}
              >
                Войти через Discord
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
