"use client";

import { useState, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { Skeleton } from "@/components/Skeleton";
import CountUp from "@/components/CountUp";

interface Record {
  title: string;
  icon: string;
  holder: string;
  value: string;
}

interface TopEntry {
  discord_id: string;
  display_name: string;
  avatar_url?: string | null;
  total_minutes?: number;
  messages?: number;
}

interface ShameData {
  records: Record[];
  topVoice: TopEntry[];
  topMsg: TopEntry[];
}

export default function ShamePage() {
  const [data, setData] = useState<ShameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shame")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxVoice = data?.topVoice?.[0]?.total_minutes || 1;
  const maxMsg = data?.topMsg?.[0]?.messages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <h1 className="text-3xl font-bold text-white mb-2">
          Доска <span className="text-gradient">позора</span>
        </h1>
        <p className="text-gray-500 mb-10">Стена славы... и не очень</p>
      </FadeIn>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : data ? (
        <>
          {/* Records */}
          {data.records.length > 0 && (
            <section className="mb-12">
              <FadeIn>
                <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <span>🏅</span> Рекорды
                </h2>
              </FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.records.map((record, i) => (
                  <FadeIn key={record.title} delay={i * 80} direction="up">
                    <div className={`card-shine bg-surface rounded-xl border p-5 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 ${
                      i === 0 ? "border-yellow-500/40 gradient-border" : "border-surface-border hover:border-purple-600/50"
                    }`}>
                      <div className="text-3xl mb-3">{record.icon}</div>
                      <h3 className="text-white font-bold mb-1">{record.title}</h3>
                      <p className="text-purple-400 font-medium text-sm">{record.holder}</p>
                      <p className="text-gray-500 text-xs mt-1">{record.value}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </section>
          )}

          {/* Top Voice */}
          {data.topVoice.length > 0 && (
            <section className="mb-12">
              <FadeIn>
                <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <span>🎙️</span> Топ по войсу
                </h2>
              </FadeIn>
              <FadeIn delay={100}>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                  {data.topVoice.map((entry, i) => {
                    const barWidth = ((entry.total_minutes || 0) / maxVoice) * 100;
                    const totalMin = entry.total_minutes || 0;
                    const h = Math.floor(totalMin / 60);
                    const m = totalMin % 60;
                    const timeStr = h > 0 ? `${h}ч ${m}м` : `${m}м`;
                    return (
                      <div
                        key={entry.discord_id}
                        className="relative flex items-center justify-between px-6 py-4 border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-all duration-200 group"
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-purple-600/5 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="relative flex items-center gap-4">
                          <span className="text-2xl w-10 text-center">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-600 text-base">#{i + 1}</span>}
                          </span>
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-purple-600/30 transition-all" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-xs text-purple-300 font-bold">
                              {entry.display_name[0]}
                            </div>
                          )}
                          <span className="text-white font-medium group-hover:text-purple-300 transition-colors">{entry.display_name}</span>
                        </div>
                        <span className="relative text-purple-400 font-bold">
                          {timeStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
            </section>
          )}

          {/* Top Messages */}
          {data.topMsg.length > 0 && (
            <section className="mb-12">
              <FadeIn>
                <h2 className="text-xl font-bold text-warning mb-4 flex items-center gap-2">
                  <span>💬</span> Топ болтунов
                </h2>
              </FadeIn>
              <FadeIn delay={100}>
                <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
                  {data.topMsg.map((entry, i) => {
                    const barWidth = ((entry.messages || 0) / maxMsg) * 100;
                    return (
                      <div
                        key={entry.discord_id}
                        className="relative flex items-center justify-between px-6 py-4 border-b border-surface-border last:border-b-0 hover:bg-surface-light transition-all duration-200 group"
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-yellow-600/5 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                        <div className="relative flex items-center gap-4">
                          <span className="text-2xl w-10 text-center">
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-600 text-base">#{i + 1}</span>}
                          </span>
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-yellow-600/30 transition-all" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center text-xs text-yellow-300 font-bold">
                              {entry.display_name[0]}
                            </div>
                          )}
                          <span className="text-white font-medium group-hover:text-yellow-300 transition-colors">{entry.display_name}</span>
                        </div>
                        <span className="relative text-warning font-bold">
                          <CountUp end={entry.messages || 0} /> сообщ.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </FadeIn>
            </section>
          )}

          {data.records.length === 0 && data.topVoice.length === 0 && data.topMsg.length === 0 && (
            <FadeIn direction="none">
              <div className="gradient-border text-center py-12 px-6">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-gray-400">Пока нет данных — бот начал собирать статистику</p>
                <p className="text-sm text-gray-600 mt-1">Рекорды появятся когда участники начнут общаться</p>
              </div>
            </FadeIn>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-center">Не удалось загрузить данные</p>
      )}
    </div>
  );
}
