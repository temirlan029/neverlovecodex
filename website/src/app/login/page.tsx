"use client";

import { useAuth } from "@/components/AuthProvider";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import FadeIn from "@/components/FadeIn";

function LoginContent() {
  const { user, loading, login } = useAuth();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const from = searchParams.get("from");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <FadeIn>
          <div className="bg-surface rounded-2xl border border-surface-border p-8">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-purple-600/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.displayName[0]}
              </div>
            )}
            <h2 className="text-xl font-bold text-white mb-1">{user.displayName}</h2>
            <p className="text-gray-500 mb-6">@{user.username}</p>
            <p className="text-green-400 text-sm">
              {user.isMember ? "Участник клана NeverLove" : "Не участник клана"}
            </p>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <FadeIn>
        <div className="bg-surface rounded-2xl border border-surface-border p-8">
          {/* Discord icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-[#5865F2] rounded-2xl flex items-center justify-center">
            <svg width="28" height="22" viewBox="0 0 28 22" fill="white">
              <path d="M23.7 1.84A23.25 23.25 0 0 0 17.98.04a.09.09 0 0 0-.09.04c-.25.44-.52.95-.72 1.37a21.5 21.5 0 0 0-6.35 0A14.5 14.5 0 0 0 10.1.08a.09.09 0 0 0-.1-.04A23.17 23.17 0 0 0 4.3 1.84a.08.08 0 0 0-.04.03C.63 7.03-.38 12.05.12 17a.1.1 0 0 0 .04.06 23.3 23.3 0 0 0 7 3.5.09.09 0 0 0 .1-.03 16.6 16.6 0 0 0 1.44-2.32.09.09 0 0 0-.05-.12 15.4 15.4 0 0 1-2.19-1.03.09.09 0 0 1 0-.15c.15-.11.29-.22.43-.34a.09.09 0 0 1 .09-.01 16.6 16.6 0 0 0 14.02 0 .09.09 0 0 1 .1.01c.13.12.28.23.42.34a.09.09 0 0 1 0 .15c-.7.4-1.43.75-2.2 1.03a.09.09 0 0 0-.04.12c.42.8.9 1.58 1.43 2.32a.09.09 0 0 0 .1.03 23.23 23.23 0 0 0 7.01-3.5.09.09 0 0 0 .04-.06c.59-6.05-.98-11.03-4.17-15.13a.07.07 0 0 0-.04-.03ZM9.35 13.95c-1.32 0-2.41-1.2-2.41-2.68 0-1.48 1.07-2.68 2.41-2.68 1.36 0 2.44 1.21 2.42 2.68 0 1.48-1.07 2.68-2.42 2.68Zm8.95 0c-1.33 0-2.42-1.2-2.42-2.68 0-1.48 1.07-2.68 2.42-2.68 1.35 0 2.43 1.21 2.41 2.68 0 1.48-1.06 2.68-2.41 2.68Z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Войти в NeverLove</h1>
          <p className="text-gray-500 mb-6">
            {from
              ? "Эта страница доступна только участникам клана"
              : "Используй свой Discord аккаунт для входа"}
          </p>

          {error === "not_member" && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-600/30 rounded-lg text-sm text-red-400">
              Ты не состоишь в Discord сервере NeverLove. Вступи в клан, чтобы получить доступ.
            </div>
          )}

          {error === "auth_failed" && (
            <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-600/30 rounded-lg text-sm text-red-400">
              Ошибка авторизации. Попробуй ещё раз.
            </div>
          )}

          <button
            onClick={login}
            className="w-full px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Войти через Discord
          </button>

          <p className="text-xs text-gray-600 mt-4">
            Мы получим только твоё имя и аватар из Discord
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
