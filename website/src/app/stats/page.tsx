"use client";

import { useState, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { Skeleton } from "@/components/Skeleton";
import CountUp from "@/components/CountUp";

interface StatsData {
  totalMembers: number;
  onlineCount: number;
  inVoiceCount: number;
  activityByHour: number[];
  activityByDay: { day: string; value: number }[];
  topMessagers: { discord_id: string; display_name: string; avatar_url: string | null; messages: number }[];
  topEmojis: { emoji: string; count: number }[];
  topWords: { word: string; count: number }[];
  topInviters: { discord_id: string; display_name: string; avatar_url: string | null; count: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxActivity = stats ? Math.max(...stats.activityByHour, 1) : 1;
  const maxDay = stats ? Math.max(...stats.activityByDay.map((d) => d.value), 1) : 1;
  const topMsgMax = stats?.topMessagers?.[0]?.messages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <h1 className="text-3xl font-bold text-white mb-2">Статистика</h1>
        <p className="text-gray-500 mb-10">Активность и аналитика клана</p>
      </FadeIn>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Участников", value: stats?.totalMembers, icon: "👥", color: "from-purple-600/20 to-transparent" },
          { label: "Онлайн", value: stats?.onlineCount, icon: "🟢", color: "from-green-600/20 to-transparent" },
          { label: "В войсе", value: stats?.inVoiceCount, icon: "🎙️", color: "from-blue-600/20 to-transparent" },
          { label: "Топ активист", value: null, icon: "👑", color: "from-yellow-600/20 to-transparent", text: stats?.topMessagers?.[0]?.display_name },
        ].map((stat, i) => (
          <FadeIn key={stat.label} delay={i * 100} direction="up">
            <div className={`card-shine bg-gradient-to-br ${stat.color} bg-surface rounded-xl border border-surface-border p-5 text-center hover:border-purple-600/50 transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">
                {loading ? "..." : stat.value != null ? <CountUp end={stat.value} /> : (
                  <span className="text-yellow-400 text-base">{stat.text || "—"}</span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          </FadeIn>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : stats ? (
        <>
          {/* Top messagers */}
          {stats.topMessagers.length > 0 && (
            <FadeIn>
              <section className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-gradient">TOP</span> по сообщениям
                </h2>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                  {stats.topMessagers.map((user, i) => {
                    const barWidth = (user.messages / topMsgMax) * 100;
                    return (
                      <div
                        key={user.discord_id}
                        className="relative flex items-center justify-between px-6 py-4 border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-all duration-200 group"
                      >
                        {/* Background bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-purple-600/5 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="relative flex items-center gap-4">
                          <span className="text-lg w-8 text-center">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-600">#{i + 1}</span>}
                          </span>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-purple-600/30 transition-all" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-xs text-purple-300 font-bold">
                              {user.display_name[0]}
                            </div>
                          )}
                          <span className="text-white font-medium group-hover:text-purple-300 transition-colors">{user.display_name}</span>
                        </div>
                        <span className="relative text-purple-400 font-bold">
                          <CountUp end={user.messages} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </FadeIn>
          )}

          {/* Activity heatmap by hour */}
          <FadeIn>
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4">Активность по часам</h2>
              <div className="gradient-border p-6">
                <div className="flex items-end gap-1 h-40">
                  {stats.activityByHour.map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 relative group cursor-pointer"
                      onMouseEnter={() => setHoveredHour(i)}
                      onMouseLeave={() => setHoveredHour(null)}
                    >
                      {hoveredHour === i && val > 0 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-light border border-purple-600/30 rounded-lg px-2.5 py-1 text-xs whitespace-nowrap z-10 shadow-lg shadow-purple-900/20">
                          <span className="text-purple-400 font-bold">{val}</span>
                          <span className="text-gray-400"> чел. в {i}:00</span>
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          hoveredHour === i
                            ? "bg-purple-400 shadow-lg shadow-purple-500/40"
                            : "bg-gradient-to-t from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400"
                        }`}
                        style={{ height: `${(val / maxActivity) * 100}%`, minHeight: val > 0 ? "4px" : "0" }}
                      />
                      <span className={`text-[10px] transition-colors ${hoveredHour === i ? "text-purple-400 font-bold" : "text-gray-600"}`}>
                        {i}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-3 text-center">Часы (0-23) &middot; Среднее за неделю</p>
              </div>
            </section>
          </FadeIn>

          {/* Activity by day */}
          <FadeIn>
            <section className="mb-12">
              <h2 className="text-xl font-bold text-white mb-4">Активность по дням</h2>
              <div className="bg-surface rounded-xl border border-surface-border p-6">
                <div className="flex items-end gap-3 h-40">
                  {stats.activityByDay.map((day) => (
                    <div
                      key={day.day}
                      className="flex-1 flex flex-col items-center gap-2 relative group cursor-pointer"
                      onMouseEnter={() => setHoveredDay(day.day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {hoveredDay === day.day && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-light border border-purple-600/30 rounded-lg px-2.5 py-1 text-xs whitespace-nowrap z-10 shadow-lg shadow-purple-900/20">
                          <span className="text-purple-400 font-bold">{day.value}</span>
                          <span className="text-gray-400"> чел. онлайн</span>
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          hoveredDay === day.day
                            ? "bg-purple-400 shadow-lg shadow-purple-500/40"
                            : "bg-gradient-to-t from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400"
                        }`}
                        style={{ height: `${(day.value / maxDay) * 100}%`, minHeight: day.value > 0 ? "4px" : "0" }}
                      />
                      <span className={`text-xs transition-colors ${hoveredDay === day.day ? "text-purple-400 font-bold" : "text-gray-400"}`}>
                        {day.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </FadeIn>

          {/* Emoji + Word Cloud row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Top Emojis */}
            <FadeIn>
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  😀 <span>Топ эмодзи</span>
                </h2>
                <div className="bg-surface rounded-xl border border-surface-border p-6">
                  {stats.topEmojis && stats.topEmojis.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {stats.topEmojis.map((e, i) => (
                        <div
                          key={e.emoji}
                          className="flex items-center gap-1.5 bg-surface-light rounded-lg px-3 py-2 hover:bg-purple-600/10 hover:border-purple-600/30 border border-transparent transition-all"
                          style={{ fontSize: `${Math.max(14, 24 - i)}px` }}
                        >
                          <span>{e.emoji}</span>
                          <span className="text-xs text-gray-500">{e.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm text-center py-4">Данные собираются...</p>
                  )}
                </div>
              </section>
            </FadeIn>

            {/* Word Cloud */}
            <FadeIn delay={100}>
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  ☁️ <span>Облако слов</span>
                </h2>
                <div className="bg-surface rounded-xl border border-surface-border p-6">
                  {stats.topWords && stats.topWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {(() => {
                        const maxCount = stats.topWords[0]?.count || 1;
                        return stats.topWords.map((w) => {
                          const scale = 0.7 + (w.count / maxCount) * 1.3;
                          const opacity = 0.4 + (w.count / maxCount) * 0.6;
                          return (
                            <span
                              key={w.word}
                              className="text-purple-400 hover:text-purple-300 transition-colors cursor-default"
                              style={{ fontSize: `${scale}rem`, opacity }}
                              title={`${w.count} раз`}
                            >
                              {w.word}
                            </span>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm text-center py-4">Данные собираются...</p>
                  )}
                </div>
              </section>
            </FadeIn>
          </div>

          {/* Top Inviters */}
          {stats.topInviters && stats.topInviters.length > 0 && (
            <FadeIn>
              <section className="mb-12">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  📨 <span>Топ по приглашениям</span>
                </h2>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                  {stats.topInviters.map((user, i) => (
                    <div
                      key={user.discord_id}
                      className="flex items-center justify-between px-6 py-4 border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg w-8 text-center">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-600">#{i + 1}</span>}
                        </span>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-purple-600/30 transition-all" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-xs text-purple-300 font-bold">
                            {user.display_name[0]}
                          </div>
                        )}
                        <span className="text-white font-medium group-hover:text-purple-300 transition-colors">{user.display_name}</span>
                      </div>
                      <span className="text-purple-400 font-bold">
                        <CountUp end={user.count} /> чел.
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </FadeIn>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center">Не удалось загрузить данные</p>
      )}
    </div>
  );
}
