"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import FadeIn from "@/components/FadeIn";

type Tool = "marker" | "arrow" | "draw" | "eraser";
type MarkerType = "player" | "enemy" | "target";

interface Point {
  x: number;
  y: number;
}

interface DrawnElement {
  type: "marker" | "arrow" | "path";
  points: Point[];
  color: string;
  label?: string;
  markerType?: MarkerType;
}

interface SavedTactic {
  id: string;
  name: string;
  map: string;
  elements: DrawnElement[];
  createdAt: string;
}

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

const toolConfig: { id: Tool; label: string; icon: string }[] = [
  { id: "marker", label: "Маркер", icon: "📍" },
  { id: "arrow", label: "Стрелка", icon: "➡️" },
  { id: "draw", label: "Рисовать", icon: "✏️" },
  { id: "eraser", label: "Очистить", icon: "🗑️" },
];

const markerTypes: { id: MarkerType; label: string; color: string }[] = [
  { id: "player", label: "Свой", color: "#22c55e" },
  { id: "enemy", label: "Враг", color: "#ef4444" },
  { id: "target", label: "Цель", color: "#eab308" },
];

const STORAGE_KEY = "neverlove-tactics";

function loadTactics(): SavedTactic[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveTacticsToStorage(tactics: SavedTactic[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tactics));
}

export default function TacticsPage() {
  const [activeMap, setActiveMap] = useState(maps[0]);
  const [activeTool, setActiveTool] = useState<Tool>("marker");
  const [activeMarker, setActiveMarker] = useState<MarkerType>("player");
  const [elements, setElements] = useState<DrawnElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [arrowStart, setArrowStart] = useState<Point | null>(null);
  const [savedTactics, setSavedTactics] = useState<SavedTactic[]>(loadTactics);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tacticName, setTacticName] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const getPos = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background map image (cover the canvas, centered)
    const bg = bgImageRef.current;
    if (bg) {
      const scale = Math.min(canvas.width / bg.width, canvas.height / bg.height);
      const w = bg.width * scale;
      const h = bg.height * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      ctx.drawImage(bg, x, y, w, h);
      // Slight dark overlay so drawings are visible
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(x, y, w, h);
    } else {
      // Draw grid and zone circle only when no map image
      ctx.strokeStyle = "rgba(123, 47, 190, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(123, 47, 190, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    elements.forEach((el) => {
      ctx.fillStyle = el.color;
      ctx.strokeStyle = el.color;

      if (el.type === "marker" && el.points[0]) {
        const p = el.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(el.label || "?", p.x, p.y);
      }

      if (el.type === "arrow" && el.points.length === 2) {
        const [start, end] = el.points;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      if (el.type === "path" && el.points.length > 1) {
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        el.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    });
  }, [elements]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  // Load background map image
  useEffect(() => {
    const img = new Image();
    img.src = `/images/maps/${activeMap.file}.png`;
    img.onload = () => {
      bgImageRef.current = img;
      redraw();
    };
    img.onerror = () => {
      bgImageRef.current = null;
      redraw();
    };
  }, [activeMap, redraw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    if (activeTool === "marker") {
      const label = prompt("Подпись (например: 2, 3, A)") || "•";
      const color = markerTypes.find((m) => m.id === activeMarker)?.color || "#fff";
      setElements([...elements, { type: "marker", points: [pos], color, label, markerType: activeMarker }]);
    } else if (activeTool === "arrow") {
      setArrowStart(pos);
    } else if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentPath([pos]);
    } else if (activeTool === "eraser") {
      setElements([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && activeTool === "draw") {
      const pos = getPos(e);
      setCurrentPath((prev) => [...prev, pos]);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.strokeStyle = "#a67bff";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      if (currentPath.length > 0) {
        const last = currentPath[currentPath.length - 1];
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (activeTool === "arrow" && arrowStart) {
      const pos = getPos(e);
      setElements([...elements, { type: "arrow", points: [arrowStart, pos], color: "#a67bff" }]);
      setArrowStart(null);
    }
    if (activeTool === "draw" && isDrawing) {
      setElements([...elements, { type: "path", points: currentPath, color: "#a67bff" }]);
      setIsDrawing(false);
      setCurrentPath([]);
    }
  };

  const handleSave = () => {
    if (!tacticName.trim() || elements.length === 0) return;
    const newTactic: SavedTactic = {
      id: Date.now().toString(),
      name: tacticName.trim(),
      map: activeMap.name,
      elements,
      createdAt: new Date().toLocaleString("ru-RU"),
    };
    const updated = [newTactic, ...savedTactics];
    setSavedTactics(updated);
    saveTacticsToStorage(updated);
    setTacticName("");
    setShowSaveModal(false);
  };

  const handleLoad = (tactic: SavedTactic) => {
    const found = maps.find((m) => m.name === tactic.map);
    if (found) setActiveMap(found);
    setElements(tactic.elements);
    setShowSaved(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedTactics.filter((t) => t.id !== id);
    setSavedTactics(updated);
    saveTacticsToStorage(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <FadeIn>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Тактический редактор</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="px-4 py-2 bg-surface text-purple-400 text-sm font-medium rounded-lg border border-surface-border hover:border-purple-600/50 transition-all"
            >
              Сохранённые ({savedTactics.length})
            </button>
            <button
              onClick={() => elements.length > 0 && setShowSaveModal(true)}
              disabled={elements.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
        <p className="text-gray-500 mb-8">Рисуй тактики, расставляй позиции, планируй атаку</p>
      </FadeIn>

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <FadeIn direction="none">
            <div className="bg-surface rounded-xl border border-surface-border p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Сохранить тактику</h3>
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1 block">Название</label>
                <input
                  type="text"
                  value={tacticName}
                  onChange={(e) => setTacticName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Например: Атака слева на Церковь"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-surface-light border border-surface-border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-600 transition-colors"
                />
              </div>
              <div className="mb-4 text-sm text-gray-500">
                Карта: <span className="text-purple-400">{activeMap.name}</span> · Элементов: <span className="text-white">{elements.length}</span>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={!tacticName.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      )}

      {/* Saved tactics panel */}
      {showSaved && (
        <FadeIn direction="none">
          <div className="bg-surface rounded-xl border border-surface-border p-4 mb-6">
            <h3 className="text-sm font-bold text-white mb-3">Сохранённые тактики</h3>
            {savedTactics.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">Нет сохранённых тактик</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {savedTactics.map((tactic) => (
                  <div
                    key={tactic.id}
                    className="flex items-center justify-between bg-surface-light rounded-lg border border-surface-border p-3 hover:border-purple-600/50 transition-all group"
                  >
                    <button
                      onClick={() => handleLoad(tactic)}
                      className="flex-1 text-left"
                    >
                      <div className="text-white text-sm font-medium group-hover:text-purple-400 transition-colors">
                        {tactic.name}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {tactic.map} · {tactic.elements.length} эл. · {tactic.createdAt}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(tactic.id)}
                      className="ml-2 p-1.5 text-gray-600 hover:text-danger transition-colors rounded"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Map selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {maps.map((map) => (
          <button
            key={map.name}
            onClick={() => { setActiveMap(map); setElements([]); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeMap.name === map.name
                ? "bg-purple-600 text-white"
                : "bg-surface text-gray-400 border border-surface-border hover:text-purple-300"
            }`}
          >
            {map.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Toolbar */}
        <div className="lg:w-48 flex lg:flex-col gap-2">
          <div className="bg-surface rounded-xl border border-surface-border p-3 flex lg:flex-col gap-2">
            <p className="text-xs text-gray-500 hidden lg:block mb-1">Инструменты</p>
            {toolConfig.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.id === "eraser") {
                    setElements([]);
                  } else {
                    setActiveTool(tool.id);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeTool === tool.id && tool.id !== "eraser"
                    ? "bg-purple-600/20 text-purple-400 border border-purple-600/50"
                    : "text-gray-400 hover:text-purple-300 hover:bg-surface-light"
                }`}
              >
                <span>{tool.icon}</span>
                <span className="hidden lg:inline">{tool.label}</span>
              </button>
            ))}
          </div>

          {activeTool === "marker" && (
            <div className="bg-surface rounded-xl border border-surface-border p-3 flex lg:flex-col gap-2">
              <p className="text-xs text-gray-500 hidden lg:block mb-1">Тип маркера</p>
              {markerTypes.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => setActiveMarker(mt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeMarker === mt.id
                      ? "border border-purple-600/50 bg-purple-600/10"
                      : "hover:bg-surface-light"
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mt.color }} />
                  <span className="hidden lg:inline text-gray-300">{mt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="bg-surface rounded-xl border border-surface-border p-3">
            <p className="text-xs text-gray-500 mb-1 hidden lg:block">Элементов</p>
            <p className="text-white font-bold text-center">{elements.length}</p>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className="flex-1 bg-surface-light rounded-xl border border-surface-border overflow-hidden cursor-crosshair relative"
          style={{ minHeight: "600px" }}
        >
          <div className="absolute top-3 left-3 z-10 bg-surface/80 backdrop-blur px-3 py-1.5 rounded-lg border border-surface-border">
            <span className="text-sm text-purple-400 font-medium">{activeMap.name}</span>
          </div>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full"
          />
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-6 text-center">
        Тактики сохраняются локально в браузере
      </p>
    </div>
  );
}
