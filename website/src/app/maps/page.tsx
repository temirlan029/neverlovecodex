"use client";

import { useState } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";

const maps = [
  { name: "Церковь", file: "церковь" },
  { name: "Завод", file: "завод" },
  { name: "Кейшоп", file: "кейшоп" },
  { name: "Пирс", file: "пирс" },
  { name: "Миррор", file: "миррор" },
  { name: "Тату", file: "тату" },
  { name: "Сендик", file: "сендик" },
  { name: "Бизвар", file: "бизвар" },
  { name: "Ветряки", file: "витряки" },
  { name: "Яки", file: "яки" },
  { name: "Палето", file: "палето" },
  { name: "Рокфорд", file: "рокфорд" },
  { name: "Ферма NEW", file: "ферма" },
  { name: "Порт NEW", file: "порт" },
];

const legendItems = [
  { label: "Важен", color: "bg-success" },
  { label: "Не важен", color: "bg-info" },
  { label: "Запрещен", color: "bg-danger" },
];

export default function MapsPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const activeMap = maps[activeIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <h1 className="text-3xl font-bold text-white mb-2">Карты залазов</h1>
        <p className="text-gray-500 mb-8">Ban Ban Pink — {maps.length} локаций с отмеченными точками</p>
      </FadeIn>

      {/* Legend */}
      <FadeIn delay={100}>
        <div className="flex items-center gap-6 mb-6">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm text-gray-400">{item.label}</span>
            </div>
          ))}
          <span className="text-xs text-gray-600 ml-auto">Клик по карте — полный экран</span>
        </div>
      </FadeIn>

      {/* Map tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {maps.map((map, i) => (
          <button
            key={map.name}
            onClick={() => setActiveIdx(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeIdx === i
                ? "bg-purple-600 text-white glow-purple-sm"
                : "bg-surface text-gray-400 border border-surface-border hover:text-purple-300 hover:border-purple-600/50"
            }`}
          >
            {map.name}
          </button>
        ))}
      </div>

      {/* Map display */}
      <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
        <div
          className="flex items-center justify-center bg-surface-light p-4 cursor-zoom-in"
          onClick={() => setFullscreen(true)}
        >
          <Image
            src={`/images/maps/${activeMap.file}.png`}
            alt={activeMap.name}
            width={810}
            height={800}
            className="rounded-lg max-h-[70vh] w-auto h-auto"
            style={{ imageRendering: "auto" }}
            priority
          />
        </div>

        {/* Map info */}
        <div className="px-6 py-4 border-t border-surface-border flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <span className="text-white font-bold">{activeMap.name}</span> · Зона: <span className="text-purple-400">35x35</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={activeIdx === 0}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Пред.
            </button>
            <span className="text-sm text-gray-500">{activeIdx + 1} / {maps.length}</span>
            <button
              onClick={() => setActiveIdx(Math.min(maps.length - 1, activeIdx + 1))}
              disabled={activeIdx === maps.length - 1}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              След. →
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center cursor-zoom-out"
          onClick={() => setFullscreen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIdx(Math.max(0, activeIdx - 1)); }}
              disabled={activeIdx === 0}
              className="px-4 py-2 bg-surface/80 text-gray-300 hover:text-white rounded-lg border border-surface-border disabled:opacity-30 transition-colors"
            >
              ←
            </button>
            <span className="text-white font-bold">{activeMap.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveIdx(Math.min(maps.length - 1, activeIdx + 1)); }}
              disabled={activeIdx === maps.length - 1}
              className="px-4 py-2 bg-surface/80 text-gray-300 hover:text-white rounded-lg border border-surface-border disabled:opacity-30 transition-colors"
            >
              →
            </button>
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 bg-surface/80 text-gray-300 hover:text-white rounded-lg border border-surface-border transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Image
            src={`/images/maps/${activeMap.file}.png`}
            alt={activeMap.name}
            width={810}
            height={800}
            className="max-w-[95vw] max-h-[90vh] w-auto h-auto rounded-lg"
            priority
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
