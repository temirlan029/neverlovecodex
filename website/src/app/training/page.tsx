export default function TrainingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Training</h1>
      <p className="text-gray-500 mb-12">Тренировки и гайды для участников клана</p>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-6xl mb-6">🏗️</div>
        <h2 className="text-2xl font-bold text-white mb-4">В разработке</h2>
        <p className="text-gray-400 max-w-md text-center">
          Здесь будут гайды по паркуру, видео тренировок, советы по залазам через
          мусорные ящики от первого лица и многое другое.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {[
            { icon: "🧗", title: "Паркур", desc: "Гайды по залазам и прыжкам" },
            { icon: "🎯", title: "Стрельба", desc: "Тренировка прицеливания" },
            { icon: "🧠", title: "Тактика", desc: "Позиционирование и командная игра" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-surface rounded-xl border border-surface-border p-5 text-center opacity-50"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="text-white font-bold mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
