import { Outlet, useLocation, Link, useNavigate } from "react-router";
import { LayoutDashboard, History, Activity, Settings, Building2 } from "lucide-react";
import { cn } from "./ui/utils";
import { useAuthStore } from "@/lib/authStore";
import { useEffect } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/history", label: "History", icon: History },
  { path: "/device", label: "Device", icon: Activity },
  { path: "/hospitals", label: "Hospitals", icon: Building2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !onboardingCompleted) {
      navigate("/auth/login");
    }
  }, [isAuthenticated, onboardingCompleted, navigate]);

  if (!isAuthenticated || !onboardingCompleted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-green-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-border overflow-y-auto">
          {/* Logo / Brand */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-lg text-foreground">MedReminder</h1>
              <p className="text-xs text-muted-foreground">Smart Dispenser</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        <main className="flex-1 pb-20 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border md:hidden z-50">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                    isActive
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
