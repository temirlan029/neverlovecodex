import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 font-bold">NeverLove</span>
            <span className="text-gray-500 text-sm">GTA V RP | Majestic</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://discord.gg/agJ4dxNFT8"
              target="_blank"
              className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
            >
              Discord
            </Link>
          </div>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} NeverLove Clan
          </p>
        </div>
      </div>
    </footer>
  );
}
