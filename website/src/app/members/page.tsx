"use client";

import { useState, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { Skeleton } from "@/components/Skeleton";
import CountUp from "@/components/CountUp";

interface Member {
  discord_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  roles: string[];
  joined_at: string | null;
  is_online: boolean;
  is_in_voice: boolean;
  voice_channel: string | null;
  messages: number;
  voice_minutes: number;
  xp: number;
  level: number;
}

const roleColors: Record<string, string> = {
  "Лидер": "text-yellow-400 bg-yellow-400/10 border-yellow-500/30",
  "Зам.Лидера": "text-orange-400 bg-orange-400/10 border-orange-500/30",
  "Dep owner": "text-orange-400 bg-orange-400/10 border-orange-500/30",
  "Офицер": "text-purple-400 bg-purple-400/10 border-purple-500/30",
  "MAIN": "text-blue-400 bg-blue-400/10 border-blue-500/30",
  "High": "text-cyan-400 bg-cyan-400/10 border-cyan-500/30",
  "Recruit": "text-green-400 bg-green-400/10 border-green-500/30",
};

function getRoleColor(roles: string[]): string {
  for (const role of roles) {
    if (roleColors[role]) return roleColors[role];
  }
  return "text-gray-400 bg-gray-400/10 border-gray-500/30";
}

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(data.members || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...members].sort((a, b) => b.xp - a.xp);
  const filtered = search
    ? sorted.filter((m) => m.display_name.toLowerCase().includes(search.toLowerCase()))
    : sorted;
  const topRole = (roles: string[]) => roles[0] || "Участник";
  const onlineCount = members.filter((m) => m.is_online).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <h1 className="text-3xl font-bold text-white mb-2">Участники</h1>
        <p className="text-gray-500 mb-8">
          {loading ? "Загрузка..." : (
            <>
              <span className="text-purple-400 font-semibold">{members.length}</span> участников &middot;{" "}
              <span className="text-success font-semibold">{onlineCount}</span> онлайн
            </>
          )}
        </p>
      </FadeIn>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Top 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {sorted.slice(0, 3).map((member, i) => {
              const nextXp = xpForLevel(member.level + 1);
              const prevXp = member.level > 0 ? xpForLevel(member.level) : 0;
              const progress = nextXp > prevXp ? Math.min(((member.xp - prevXp) / (nextXp - prevXp)) * 100, 100) : 0;
              return (
                <FadeIn key={member.discord_id} delay={i * 150} direction="up">
                  <div
                    className={`card-shine bg-surface rounded-xl border p-6 text-center transition-all duration-300 hover:scale-105 hover:-translate-y-2 ${
                      i === 0 ? "border-yellow-500/50 gradient-border" : "border-surface-border hover:border-purple-600/50"
                    }`}
                  >
                    <div className="text-4xl mb-3">{i === 0 ? "👑" : i === 1 ? "🥈" : "🥉"}</div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${member.is_online ? "bg-success status-online" : "bg-gray-600"}`} />
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-full ring-2 ring-purple-600/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-lg text-purple-300 font-bold">
                          {member.display_name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-lg font-bold text-white block mb-1">{member.display_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(member.roles)}`}>
                      {topRole(member.roles)}
                    </span>
                    <div className="mt-4 space-y-2">
                      <div className="text-sm text-gray-400">
                        Lv.<span className="text-purple-400 font-bold text-lg">{member.level}</span>
                      </div>
                      <div className="w-full bg-surface-light rounded-full h-2 overflow-hidden">
                        <div className="xp-bar h-full" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-xs text-gray-500">
                        <CountUp end={member.xp} /> / {nextXp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {/* Search */}
          <FadeIn>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Поиск участника..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 bg-surface border border-surface-border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-600/50 transition-colors"
              />
            </div>
          </FadeIn>

          {/* Full table */}
          <FadeIn>
            <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-sm text-gray-500">
                      <th className="px-4 py-4 w-12">#</th>
                      <th className="px-4 py-4">Игрок</th>
                      <th className="px-4 py-4">Роль</th>
                      <th className="px-4 py-4">Уровень</th>
                      <th className="px-4 py-4">Сообщения</th>
                      <th className="px-4 py-4">Войс</th>
                      <th className="px-4 py-4 hidden lg:table-cell">Вступил</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((member, i) => (
                      <tr
                        key={member.discord_id}
                        className="border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-colors group"
                      >
                        <td className="px-4 py-3 text-gray-600 text-sm">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              {member.avatar_url ? (
                                <img src={member.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                                  {member.display_name[0]}
                                </div>
                              )}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${member.is_online ? "bg-success" : "bg-gray-600"}`} />
                            </div>
                            <span className="text-white font-medium text-sm group-hover:text-purple-300 transition-colors">
                              {member.display_name}
                            </span>
                            {member.is_in_voice && <span className="text-[10px] text-purple-400/60">🎙</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleColor(member.roles)}`}>
                            {topRole(member.roles)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-purple-400 font-bold">{member.level}</span>
                          <span className="text-gray-600 text-xs ml-1">({member.xp.toLocaleString()} xp)</span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{member.messages.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-300 text-sm">{Math.round(member.voice_minutes / 60)}ч</td>
                        <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                          {member.joined_at ? new Date(member.joined_at).toLocaleDateString("ru-RU") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">Ничего не найдено</div>
              )}
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}
