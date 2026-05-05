"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { Skeleton } from "@/components/Skeleton";
import CountUp from "@/components/CountUp";
import Particles from "@/components/Particles";

interface OnlineMember {
  display_name: string;
  roles: string[];
  is_online: boolean;
  is_in_voice: boolean;
  voice_channel: string | null;
  avatar_url: string | null;
}

interface QuoteData {
  text: string;
  author: string;
}

export default function HomePage() {
  const [members, setMembers] = useState<OnlineMember[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [membersRes, quoteRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/quotes"),
        ]);
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
          setTotalMembers(data.total || 0);
          setOnlineCount(data.online || 0);
        }
        if (quoteRes.ok) {
          const data = await quoteRes.json();
          setQuote(data.quote);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onlineMembers = members.filter((m) => m.is_online);
  const inVoice = members.filter((m) => m.is_in_voice);
  const topRole = (roles: string[]) => roles[0] || "Участник";

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-28 px-4 text-center overflow-hidden">
        <Particles />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(123,47,190,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <FadeIn delay={0}>
            <div className="mb-6 animate-float">
              <div className="rounded-2xl inline-block" style={{ boxShadow: "0 0 30px rgba(123, 47, 190, 0.3)" }}>
                <Image
                  src="/images/logo.png"
                  alt="NeverLove"
                  width={150}
                  height={150}
                  className="rounded-2xl"
                  priority
                  unoptimized
                />
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={150}>
            <h1 className="text-5xl sm:text-7xl font-black mb-4 tracking-tight">
              <span className="text-white">NEVER</span>
              <span className="text-gradient">LOVE</span>
            </h1>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto mb-3">
              GTA V RP | Majestic Server
            </p>
            {!loading && (
              <p className="text-purple-400/60 text-sm mb-8">
                {totalMembers} участников &middot; {onlineCount} онлайн
              </p>
            )}
          </FadeIn>
          <FadeIn delay={450}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="https://discord.gg/agJ4dxNFT8"
                target="_blank"
                className="group relative px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all hover:scale-105 glow-purple-sm overflow-hidden"
              >
                <span className="relative z-10">Discord</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/maps"
                className="px-7 py-3.5 bg-surface-light hover:bg-surface-border text-purple-300 font-semibold rounded-xl border border-surface-border transition-all hover:scale-105 hover:border-purple-600/50"
              >
                Карты залазов
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Участников", value: totalMembers, icon: "👥", color: "from-purple-600/20 to-transparent" },
            { label: "Сейчас онлайн", value: onlineCount, icon: "🟢", color: "from-green-600/20 to-transparent" },
            { label: "В войсе", value: inVoice.length, icon: "🎙️", color: "from-blue-600/20 to-transparent" },
            { label: "Карт залазов", value: 14, icon: "🗺️", color: "from-yellow-600/20 to-transparent" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 100} direction="up">
              <div className={`card-shine bg-gradient-to-br ${stat.color} bg-surface rounded-xl border border-surface-border p-5 text-center hover:border-purple-600/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white">
                  {loading ? "..." : <CountUp end={stat.value} />}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Online members */}
      <FadeIn>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-success status-online" />
            Сейчас онлайн
            {!loading && <span className="text-sm font-normal text-gray-500">({onlineMembers.length})</span>}
          </h2>
          <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : onlineMembers.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-500">
                <p className="text-3xl mb-2">😴</p>
                <p>Все спят...</p>
              </div>
            ) : (
              onlineMembers.slice(0, 15).map((member, i) => (
                <div
                  key={member.display_name}
                  className="flex items-center justify-between px-6 py-3.5 border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-all duration-200 group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-success status-online" />
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-purple-600/30 transition-all" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs text-purple-300 font-bold">
                        {member.display_name[0]}
                      </div>
                    )}
                    <span className="text-white font-medium group-hover:text-purple-300 transition-colors">{member.display_name}</span>
                    {member.is_in_voice && member.voice_channel && (
                      <span className="text-xs text-purple-400/60 flex items-center gap-1 bg-purple-600/10 px-2 py-0.5 rounded-full">
                        🎙 {member.voice_channel}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-purple-400 bg-purple-600/10 px-2 py-1 rounded-full">{topRole(member.roles)}</span>
                </div>
              ))
            )}
            {!loading && onlineMembers.length > 15 && (
              <div className="px-6 py-3 text-center text-sm text-gray-500">
                и ещё {onlineMembers.length - 15}...
              </div>
            )}
          </div>
        </section>
      </FadeIn>

      {/* Random quote */}
      {quote && (
        <FadeIn direction="none">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="gradient-border p-8 text-center">
              <p className="text-lg text-gray-300 italic mb-3">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-sm text-purple-400">— {quote.author}</p>
            </div>
          </section>
        </FadeIn>
      )}

      {/* Quick links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn>
          <h2 className="text-xl font-bold text-white mb-6">Разделы</h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: "/members", title: "Участники", desc: `${totalMembers} участников с XP и уровнями`, icon: "👥", color: "from-purple-600/20" },
            { href: "/maps", title: "Карты залазов", desc: "14 локаций Ban Ban Pink с точками", icon: "🗺️", color: "from-blue-600/20" },
            { href: "/tactics", title: "Тактический редактор", desc: "Рисуй тактики, расставляй позиции", icon: "🎯", color: "from-cyan-600/20" },
            { href: "/stats", title: "Статистика", desc: "Активность, топы, аналитика клана", icon: "📊", color: "from-green-600/20" },
            { href: "/shame", title: "Доска позора", desc: "Рекорды, топ болтунов, войс-чемпионы", icon: "🏆", color: "from-yellow-600/20" },
            { href: "/training", title: "Training", desc: "Гайды и советы для новичков", icon: "📚", color: "from-red-600/20" },
          ].map((card, i) => (
            <FadeIn key={card.href} delay={i * 100} direction="up">
              <Link
                href={card.href}
                className={`card-shine block bg-gradient-to-br ${card.color} to-surface bg-surface rounded-xl border border-surface-border p-6 hover:border-purple-600/50 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group`}
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500">{card.desc}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
