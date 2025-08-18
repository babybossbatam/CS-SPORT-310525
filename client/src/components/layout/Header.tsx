import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import MyCircularFlag from "../common/MyCircularFlag";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import LanguageIndicator from "../common/LanguageIndicator";
import { useLanguageNavigation } from "@/hooks/useLanguageNavigation";
import NotificationCenter from '@/components/common/NotificationCenter';

interface HeaderProps {
  showTextOnMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ showTextOnMobile = false }) => {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);
  const { currentLanguage, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const { navigateWithLanguage, getLinkWithLanguage } = useLanguageNavigation();
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
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    setSearchOpen(false);
    navigateWithLanguage(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  // Fetch notification preferences on component mount
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      if (!currentUser?.id) return;
      
      try {
        const response = await fetch(`/api/notification-preferences/${currentUser.id}`);
        if (response.ok) {
          const prefs = await response.json();
          setNotificationsEnabled(prefs.emailNotifications && prefs.smsNotifications);
        }
      } catch (error) {
        console.error('Failed to fetch notification preferences:', error);
      }
    };

    if (isAuthenticated && currentUser?.id) {
      fetchNotificationPreferences();
    }
  }, [isAuthenticated, currentUser?.id]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!currentUser?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage notification preferences.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/notification-preferences/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotifications: enabled,
          smsNotifications: enabled,
          pushNotifications: enabled
        }),
      });

      if (response.ok) {
        setNotificationsEnabled(enabled);
        toast({
          title: "Preferences Updated",
          description: `All notifications ${enabled ? 'enabled' : 'disabled'} successfully.`,
        });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    dispatch(userActions.logout());
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigateWithLanguage("/");
  };

  const getCountryNameFromLanguage = (lang: string): string => {
    switch (lang) {
      case "en":
        return "United States";
      case "es":
        return "Spain";
      case "zh-hk":
        return "Hong Kong";
      case "zh":
        return "China";
      case "de":
        return "Germany";
      case "it":
        return "Italy";
      case "pt":
        return "Portugal";
      default:
        return "United States";
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    const currentPath = getPathWithoutLanguage();
    const newPath = `/${languageCode}${currentPath === '/' ? '' : currentPath}`;

    // Update the language context first
    setLanguage(languageCode);

    // Navigate to new URL with updated language
    window.location.href = newPath;

    toast({
      title: "Language Changed", 
      description: `Language switched to ${getLanguageDisplayName(languageCode)}`,
    });
  };

  const getPathWithoutLanguage = (): string => {
    const supportedLanguages = ['en', 'es', 'zh-hk', 'zh', 'de', 'it', 'pt'];
    const pathParts = location.split('/').filter(part => part);

    console.log('🔍 [Header] Current location:', location);
    console.log('🔍 [Header] Path parts:', pathParts);
    console.log('🔍 [Header] Current language from context:', currentLanguage);

    if (pathParts.length > 0 && supportedLanguages.includes(pathParts[0])) {
      const remainingPath = pathParts.slice(1).join('/');
      return remainingPath ? `/${remainingPath}` : '/';
    }
    return location;
  };

  const getLanguageDisplayName = (lang: string): string => {
    switch (lang) {
      case "en":
        return "English";
      case "es":
        return "Español";
      case "zh-hk":
        return "中文 (繁體)";
      case "zh":
        return "中文";
      case "de":
        return "Deutsch";
      case "it":
        return "Italiano";
      case "pt":
        return "Português";
      default:
        return "English";
    }
  };

  return (
    <header
      className={cn(
        "bg-black text-white shadow-md fixed top-0 left-0 right-0 z-50",
        isMobile ? "h-16" : "h-[87px]",
      )}
    >
      <div
        className={cn(
          "container mx-auto flex items-center justify-between h-full",
          isMobile ? "px-4" : "px-20",
        )}
      >
        <Link
          href={getLinkWithLanguage("/")}
          className="flex-shrink-0 flex items-center h-full bg-black"
        >
          <img
            src="/CSSPORT_1_updated.png"
            alt="CSSPORT Logo"
            className={cn(
              "w-auto mr-2 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
              isMobile ? "h-8 max-h-8" : "h-full max-h-[57px]",
            )}
            onError={(e) => {
              console.log("Logo failed to load, trying fallback");
              const target = e.target as HTMLImageElement;
              if (target.src !== "/CSSPORT_1_updated.png") {
                target.src = "/CSSPORT_1_updated.png";
              }
            }}
          />
          <span className={cn("flex items-center gap-2 whitespace-nowrap")}>
            <span
              className={cn(
                "uppercase bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 bg-clip-text text-transparent font-bold transition-all duration-200 hover:from-white hover:via-yellow-100 hover:to-amber-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
                isMobile
                  ? "text-lg"
                  : "text-[clamp(2.685rem,3.146vw,3.197rem)]",
              )}
              style={{
                fontFamily: "Roboto Condensed, sans-serif",
                fontStretch: "condensed",
                letterSpacing: "-0.07em",
              }}
            >
              CS Sport
            </span>
          </span>
        </Link>

        {!isMobile && <LeagueTabs />}

        <div
          className={cn(
            "flex items-center",
            isMobile ? "gap-3" : "gap-[1.05rem]",
          )}
        >
          <div
            className={cn(
              "flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer",
              isMobile ? "text-xs" : "text-sm",
            )}
            onClick={() =>
              isAuthenticated ? navigateWithLanguage("/my-scores") : navigateWithLanguage("/login")
            }
          >
            <Star
              className={cn(
                "fill-current",
                isMobile ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1",
              )}
            />
            <span className={cn(isMobile ? "text-xs" : "")}>
              {t("myScores")}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer",
              isMobile ? "text-xs" : "text-sm",
            )}
            onClick={() => setSearchOpen(true)}
          >
            <Search className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer",
                  isMobile ? "text-xs" : "text-sm",
                )}
              >
                <Settings className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(
                "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-lg",
                isMobile ? "w-72 max-w-[90vw]" : "w-80",
              )}
              align="end"
              sideOffset={isMobile ? 8 : 4}
            >
              <DropdownMenuLabel
                className={cn(
                  "text-gray-600 dark:text-gray-400 font-medium",
                  isMobile ? "px-4 py-2 text-sm" : "text-sm",
                )}
              >
                {currentLanguage === 'zh-hk' ? '通知' : 
                 currentLanguage === 'zh-tw' ? '通知' : 
                 currentLanguage === 'zh' ? '通知' : 
                 currentLanguage === 'es' ? 'NOTIFICACIONES' : 
                 currentLanguage === 'de' ? 'BENACHRICHTIGUNGEN' : 
                 currentLanguage === 'it' ? 'NOTIFICHE' : 
                 currentLanguage === 'pt' ? 'NOTIFICAÇÕES' : 
                 'NOTIFICATIONS'}
              </DropdownMenuLabel>

              <DropdownMenuItem
                className={cn(
                  "flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  isMobile ? "min-h-[48px] px-4 py-3" : "px-3 py-2",
                )}
              >
                <span className={cn(isMobile ? "text-base" : "text-sm")}>
                  {currentLanguage === 'zh-hk' ? '啟用所有通知' : 
                   currentLanguage === 'zh-tw' ? '啟用所有通知' : 
                   currentLanguage === 'zh' ? '启用所有通知' : 
                   currentLanguage === 'es' ? 'Habilitar todas las notificaciones' : 
                   currentLanguage === 'de' ? 'Alle Benachrichtigungen aktivieren' : 
                   currentLanguage === 'it' ? 'Abilita tutte le notifiche' : 
                   currentLanguage === 'pt' ? 'Habilitar todas as notificações' : 
                   'Enable all Notifications'}
                </span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  className="data-[state=checked]:bg-blue-500"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

              <DropdownMenuLabel
                className={cn(
                  "text-gray-600 dark:text-gray-400 font-medium",
                  isMobile ? "px-4 py-2 text-sm" : "text-sm",
                )}
              >
                {currentLanguage === 'zh-hk' ? '主題' : 
                 currentLanguage === 'zh-tw' ? '主題' : 
                 currentLanguage === 'zh' ? '主题' : 
                 currentLanguage === 'es' ? 'TEMAS' : 
                 currentLanguage === 'de' ? 'THEMEN' : 
                 currentLanguage === 'it' ? 'TEMI' : 
                 currentLanguage === 'pt' ? 'TEMAS' : 
                 'THEMES'}
              </DropdownMenuLabel>

              <DropdownMenuItem
                className={cn(
                  "flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  isMobile ? "min-h-[48px] px-4 py-3" : "px-3 py-2",
                )}
              >
                <span className={cn(isMobile ? "text-base" : "text-sm")}>
                  {currentLanguage === 'zh-hk' ? '設置深色主題' : 
                   currentLanguage === 'zh-tw' ? '設置深色主題' : 
                   currentLanguage === 'zh' ? '设置暗黑主题' : 
                   currentLanguage === 'es' ? 'Establecer tema oscuro' : 
                   currentLanguage === 'de' ? 'Dunkles Theme festlegen' : 
                   currentLanguage === 'it' ? 'Imposta tema scuro' : 
                   currentLanguage === 'pt' ? 'Definir tema escuro' : 
                   'Set Dark Theme'}
                </span>
                <Switch
                  checked={darkMode}
                  onCheckedChange={() =>
                    dispatch({ type: "ui/toggleDarkMode" })
                  }
                  className="data-[state=checked]:bg-blue-500"
                />
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

              <DropdownMenuLabel
                className={cn(
                  "text-gray-600 dark:text-gray-400 font-medium",
                  isMobile ? "px-4 py-2 text-sm" : "text-sm",
                )}
              >
                {currentLanguage === 'zh-hk' ? '語言' : 
                 currentLanguage === 'zh-tw' ? '語言' : 
                 currentLanguage === 'zh' ? '语言' : 
                 currentLanguage === 'es' ? 'IDIOMA' : 
                 currentLanguage === 'de' ? 'SPRACHE' : 
                 currentLanguage === 'it' ? 'LINGUA' : 
                 currentLanguage === 'pt' ? 'IDIOMA' : 
                 'LANGUAGE'}
              </DropdownMenuLabel>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[48px] px-4 py-3" : "px-3 py-2",
                    )}
                  >
                    <div className="flex items-center">
                      <div className="mr-2">
                        <MyCircularFlag
                          teamName={getCountryNameFromLanguage(currentLanguage)}
                          size={isMobile ? "24px" : "20px"}
                          className=""
                        />
                      </div>
                      <span className={cn(isMobile ? "text-base" : "text-sm")}>
                        {getLanguageDisplayName(currentLanguage)}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")}
                    />
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white",
                    isMobile ? "w-60 max-w-[80vw]" : "w-48",
                  )}
                  side={isMobile ? "bottom" : "left"}
                  sideOffset={isMobile ? 4 : 0}
                >
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("en")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="United States"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("es")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="Spain"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    Español
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("zh-hk")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="Hong Kong"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    中文 (繁體)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("zh")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="China"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    中文
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("de")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="Germany"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    Deutsch
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("it")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="Italy"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    Italiano
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                      isMobile ? "min-h-[44px] px-3 py-2 text-base" : "text-sm",
                    )}
                    onClick={() => handleLanguageChange("pt")}
                  >
                    <div className="mr-2">
                      <MyCircularFlag
                        teamName="Portugal"
                        size={isMobile ? "20px" : "16px"}
                        className=""
                      />
                    </div>
                    Português
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

              <DropdownMenuItem
                className={cn(
                  "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-white",
                  isMobile
                    ? "min-h-[48px] px-4 py-3 text-base"
                    : "px-3 py-2 text-sm",
                )}
                onClick={() => setPrivacyModalOpen(true)}
              >
                {currentLanguage === 'zh-hk' ? '私隱設置' : 
                 currentLanguage === 'zh-tw' ? '隱私設定' : 
                 currentLanguage === 'zh' ? '隐私设置' : 
                 currentLanguage === 'es' ? 'Configuración de privacidad' : 
                 currentLanguage === 'de' ? 'Datenschutzeinstellungen' : 
                 currentLanguage === 'it' ? 'Impostazioni privacy' : 
                 currentLanguage === 'pt' ? 'Configurações de privacidade' : 
                 'Privacy Settings'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationCenter />
        </div>
        
        {isAuthenticated && (
          <div
            className={cn(
              "flex items-center font-semibold text-white transition-colors duration-200 cursor-pointer",
              isMobile ? "text-xs ml-2" : "text-sm ml-4",
            )}
          >
            {isMobile ? (
              // Mobile: Show avatar circle with initials
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-black text-xs font-bold transition-all duration-200 hover:scale-105"
                  title={
                    username
                      ? username.charAt(0).toUpperCase() + username.slice(1)
                      : ""
                  }
                >
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
                <span
                  className={`cursor-pointer transition-colors duration-200 ${
                    activeHover === "logout"
                      ? "text-amber-300"
                      : "hover:text-amber-300"
                  }`}
                  onClick={handleLogout}
                  onMouseEnter={() => setActiveHover("logout")}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  Logout
                </span>
              </div>
            ) : (
              // Desktop: Show full username
              <>
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
              </>
            )}
          </div>
        )}
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