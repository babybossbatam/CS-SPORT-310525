import { useState } from "react";
import { useLocation, Link } from "wouter";
import LeagueTabs from "./LeagueTabs";
import { Search, Star, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import PrivacySettingsModal from "@/components/modals/PrivacySettingsModal";
import { useToast } from "@/hooks/use-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import React from "react";
import { useDeviceInfo, useMobileViewport } from "@/hooks/use-mobile";

const Header = () => {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkTheme, setDarkTheme] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const { toast } = useToast();
  const dispatch = useDispatch();
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const { isMobile, isTablet, isPortrait } = useDeviceInfo();
  useMobileViewport();

  const isAuthenticated = useSelector(
    (state: RootState) => state.user.isAuthenticated,
  );
  const username = useSelector((state: RootState) => state.user.username);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  const handleLogout = () => {
    dispatch(userActions.logout());
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate("/");
  };

  return (
    <header className="bg-black text-white shadow-md fixed top-0 left-0 right-0 z-50 h-[87px]">
      <div className="container mx-auto flex items-center justify-between h-full px-20">
        <Link
          href="/"
          className="flex-shrink-0 flex items-center h-full bg-black"
        >
          <img
            src="/CSSPORT_1_updated.png"
            alt="CS SPORT Logo"
            className="h-full max-h-[57px] w-auto mr-2 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            onError={(e) => {
              console.log("Logo failed to load, trying fallback");
              const target = e.target as HTMLImageElement;
              if (target.src !== "/CSSPORT_1_updated.png") {
                target.src = "/CSSPORT_1_updated.png";
              }
            }}
          />
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span
              className="bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 bg-clip-text text-transparent font-bold text-[clamp(2.685rem,3.146vw,3.197rem)] transition-all duration-200 hover:from-white hover:via-yellow-100 hover:to-amber-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              style={{
                fontFamily: "Roboto Condensed, sans-serif",
                fontStretch: "condensed",
                letterSpacing: "-0.07em",
              }}
            >
              CS SPORT
            </span>
          </span>
        </Link>

        <LeagueTabs />

        <div className="flex items-center gap-[1.05rem]">
          <div
            className="text-sm flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            onClick={() =>
              isAuthenticated ? navigate("/my-scores") : navigate("/login")
            }
          >
            <Star className="h-4 w-4 mr-1 fill-current" />
            <span>My Scores</span>
          </div>

          <div
            className="text-sm flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="text-sm flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer">
                <Settings className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 bg-white border-gray-200 text-gray-900 shadow-lg"
              align="end"
            >
              <DropdownMenuLabel className="text-gray-600 font-medium">
                NOTIFICATIONS
              </DropdownMenuLabel>

              <DropdownMenuItem className="flex items-center justify-between hover:bg-gray-100 cursor-pointer">
                <span>Enable all Notifications</span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                  className="data-[state=checked]:bg-blue-500"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuLabel className="text-gray-600 font-medium">
                THEMES
              </DropdownMenuLabel>

              <DropdownMenuItem className="flex items-center justify-between hover:bg-gray-100 cursor-pointer">
                <span>Set Dark Theme</span>
                <Switch
                  checked={darkTheme}
                  onCheckedChange={setDarkTheme}
                  className="data-[state=checked]:bg-blue-500"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuLabel className="text-gray-600 font-medium">
                LANGUAGE
              </DropdownMenuLabel>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem className="flex items-center justify-between hover:bg-gray-100 cursor-pointer">
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">🇺🇸</span>
                      <span>{selectedLanguage}</span>
                    </div>
                    <ChevronDown className="h-3 w-3" />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 bg-white border-gray-200 text-gray-900"
                  side="left"
                >
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("English (US)")}
                  >
                    <span className="mr-2 text-lg">🇺🇸</span>
                    English (US)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("English (UK)")}
                  >
                    <span className="mr-2 text-lg">🇬🇧</span>
                    English (UK)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("Español")}
                  >
                    <span className="mr-2 text-lg">🇪🇸</span>
                    Español
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("Français")}
                  >
                    <span className="mr-2 text-lg">🇫🇷</span>
                    Français
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("中文 (简体)")}
                  >
                    <span className="mr-2 text-lg">🇨🇳</span>
                    中文 (简体)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedLanguage("中文 (繁體)")}
                  >
                    <span className="mr-2 text-lg">🇭🇰</span>
                    中文 (繁體)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuItem
                className="hover:bg-gray-100 cursor-pointer text-gray-700"
                onClick={() => setPrivacyModalOpen(true)}
              >
                Privacy Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated && (
            <div className="flex items-center text-sm font-semibold text-white transition-colors duration-200 cursor-pointer  ml-4">
              <span
                className={`transition-colors duration-200 ${
                  activeHover === "username"
                    ? "text-amber-400"
                    : activeHover === "logout"
                      ? "text-white"
                      : "hover:text-amber-400"
                }`}
                onMouseEnter={() => setActiveHover("username")}
                onMouseLeave={() => setActiveHover(null)}
              >
                {username
                  ? username.charAt(0).toUpperCase() + username.slice(1)
                  : ""}
              </span>
              <span>, </span>
              <span
                className={`cursor-pointer transition-colors duration-200 ${
                  activeHover === "logout"
                    ? "text-amber-300"
                    : activeHover === "username"
                      ? "text-white"
                      : "hover:text-amber-300"
                }`}
                onClick={handleLogout}
                onMouseEnter={() => setActiveHover("logout")}
                onMouseLeave={() => setActiveHover(null)}
              >
                Logout
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for teams, leagues, players..."
              className="w-full"
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="submit">Search</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </header>
  );
};

export default Header;
