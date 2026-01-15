import React, { useState } from "react";
import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  Compass,
  Bell,
  User,
  Settings,
  ChevronRight,
} from "lucide-react";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  submenu?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Compass, label: "Explore" },
  { icon: Bell, label: "Notifications", badge: 3 },
  {
    icon: User,
    label: "Profile",
    submenu: [
      { label: "My Profile", href: "#" },
      { label: "Edit Profile", href: "#" },
      { label: "Privacy", href: "#" },
    ],
  },
  { icon: Settings, label: "Settings" },
];

export function LiquidGlassSidebar() {
  const [activeItem, setActiveItem] = useState<string>("Home");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Grid pattern for better glass visibility */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="relative z-10">
        <LiquidGlassCard className="w-80 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Menu</h1>
          <p className="text-sm text-white/70 mt-1">Navigate your dashboard</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => {
                  setActiveItem(item.label);
                  if (item.submenu) {
                    setExpandedItem(
                      expandedItem === item.label ? null : item.label
                    );
                  }
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300",
                  activeItem === item.label
                    ? "bg-white/[0.15] text-white shadow-lg backdrop-blur-xl"
                    : "text-white/80 hover:bg-white/[0.08] hover:text-white hover:backdrop-blur-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-xl shadow-lg">
                      {item.badge}
                    </span>
                  )}
                  {item.submenu && (
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        expandedItem === item.label && "rotate-90"
                      )}
                    />
                  )}
                </div>
              </button>

              {item.submenu && expandedItem === item.label && (
                <div className="ml-4 mt-2 space-y-1 pl-4 border-l border-white/[0.12]">
                  {item.submenu.map((subitem) => (
                    <a
                      key={subitem.label}
                      href={subitem.href}
                      className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all duration-300 backdrop-blur-sm"
                    >
                      {subitem.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-8 pt-6 border-t border-white/[0.12]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-white/70">john@example.com</p>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
      </div>
    </div>
  );
}
