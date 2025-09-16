import { useState } from "react";
import { useLocation } from "wouter";
import { useDispatch } from "react-redux";
import { userActions } from "@/lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import MyCircularFlag from "@/components/common/MyCircularFlag";

// Extend the user schema with login validation
const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password is required"),
});

// Extend the insertUserSchema with password confirmation
const registerSchema = insertUserSchema
  .extend({
    passwordConfirm: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

type AuthMode = "login" | "register";

interface AuthenticationProps {
  mode?: AuthMode;
}

// Country codes with flags and typical phone number lengths
const countryCodes = [
  { code: "+852", country: "Hong Kong", flag: "🇭🇰", digits: 8 },
  { code: "+86", country: "China", flag: "🇨🇳", digits: 11 },
  { code: "+81", country: "Japan", flag: "🇯🇵", digits: 10 },
  { code: "+82", country: "South Korea", flag: "🇰🇷", digits: 10 },
  { code: "+63", country: "Philippines", flag: "🇵🇭", digits: 10 },
  { code: "+855", country: "Cambodia", flag: "🇰🇭", digits: 9 },
  { code: "+1", country: "United States", flag: "🇺🇸", digits: 10 },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", digits: 10 },
  { code: "+33", country: "France", flag: "🇫🇷", digits: 10 },
  { code: "+49", country: "Germany", flag: "🇩🇪", digits: 11 },
  { code: "+39", country: "Italy", flag: "🇮🇹", digits: 10 },
  { code: "+34", country: "Spain", flag: "🇪🇸", digits: 9 },
  { code: "+91", country: "India", flag: "🇮🇳", digits: 10 },
  { code: "+65", country: "Singapore", flag: "🇸🇬", digits: 8 },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", digits: 10 },
  { code: "+66", country: "Thailand", flag: "🇹🇭", digits: 9 },
  { code: "+84", country: "Vietnam", flag: "🇻🇳", digits: 9 },
  { code: "+62", country: "Indonesia", flag: "🇮🇩", digits: 11 },
];

const CountryCodeSelect = ({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) => {
  const selectedCountry = countryCodes.find(c => c.code === value);

  return (
    <div className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-24 h-8 border-none bg-transparent text-white/70 text-sm focus:ring-0 focus:ring-offset-0 cursor-pointer hover:bg-transparent hover:text-white/70">
          <SelectValue>
            <div className="flex items-center gap-1">
              <MyCircularFlag 
                teamName={selectedCountry?.country || "Hong Kong"}
                size="20px"
                className="flex-shrink-0"
              />
              <span className="text-xs">{value}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg z-50">
          {countryCodes.map((country) => (
            <SelectItem 
              key={country.code} 
              value={country.code}
              className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MyCircularFlag 
                  teamName={country.country}
                  size="24px"
                  className="flex-shrink-0"
                />
                <span className="text-sm font-medium">{country.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const Authentication = ({ mode = "login" }: AuthenticationProps) => {
  const [activeTab, setActiveTab] = useState<AuthMode>(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const dispatch = useDispatch();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirm: "",
      fullName: "",
      phoneNumber: "",
    },
  });

  // Country code state
  const [selectedCountryCode, setSelectedCountryCode] = useState("+852");
  const [isPhoneInputFocused, setIsPhoneInputFocused] = useState(false);
  const [isUsernameInputFocused, setIsUsernameInputFocused] = useState(false);

  // Handle login submission
  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const userData = await response.json();

      dispatch(
        userActions.setUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
        }),
      );

      // Get user preferences
      try {
        const prefsResponse = await apiRequest(
          "GET",
          `/api/user/${userData.id}/preferences`,
        );
        const prefsData = await prefsResponse.json();

        dispatch(
          userActions.setUserPreferences({
            favoriteTeams: prefsData.favoriteTeams || [],
            favoriteLeagues: prefsData.favoriteLeagues || [],
            favoriteMatches: prefsData.favoriteMatches || [],
            region: prefsData.region || "global",
          }),
        );
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.username}!`,
      });

      // Extract current language from URL or default to 'en'
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/").filter((part) => part);
      const currentLang = pathParts[0] || "en";

      navigate(`/${currentLang}`);
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register submission
  const onRegisterSubmit = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);

    // Remove passwordConfirm as it's not part of the API model
    const { passwordConfirm, ...userData } = data;

    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const newUser = await response.json();

      dispatch(
        userActions.setUser({
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
        }),
      );

      // Set default preferences
      dispatch(
        userActions.setUserPreferences({
          favoriteTeams: [],
          favoriteLeagues: [],
          favoriteMatches: [],
          region: "global",
        }),
      );

      toast({
        title: "Registration Successful",
        description: `Welcome to CS Sport, ${newUser.username}!`,
      });

      // Extract current language from URL or default to 'en'
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/").filter((part) => part);
      const currentLang = pathParts[0] || "en";

      navigate(`/${currentLang}`);
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration Failed",
        description:
          "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.7)" }}
        >
          <source
            src="/assets/matchdetaillogo/vecteezy_sport-stadium-video-background-flashing-lights-glowing_4213949.mp4"
            type="video/mp4"
          />
          {/* Fallback for when video doesn't load */}
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/CSSPORT_1_updated.png"
                alt="CS SPORT Logo"
                className="h-20 w-auto mr-4 drop-shadow-2xl"
                onError={(e) => {
                  console.log("Logo failed to load, trying fallback");
                  const target = e.target as HTMLImageElement;
                  if (target.src !== "/CSSPORT_1_updated.png") {
                    target.src = "/CSSPORT_1_updated.png";
                  }
                }}
              />
              <span
                className="uppercase bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 bg-clip-text text-transparent font-bold text-5xl drop-shadow-2xl"
                style={{
                  fontFamily: "Roboto Condensed, sans-serif",
                  fontStretch: "condensed",
                  letterSpacing: "-0.07em",
                }}
              >
                CS Sport
              </span>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl rounded-lg">
            <CardContent className="p-6 relative">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as AuthMode)}
              >
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white/70"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <Input
                                  placeholder="username"
                                  {...field}
                                  className="h-14 pl-14 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white text-xl placeholder:text-white/60 focus:bg-white/20"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white/70"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <Input
                                  type="password"
                                  placeholder="password"
                                  {...field}
                                  className="h-14 pl-14 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white/70"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <Input
                                  placeholder="Username"
                                  {...field}
                                  onFocus={() => setIsUsernameInputFocused(true)}
                                  onBlur={() => setIsUsernameInputFocused(false)}
                                  className="h-14 pl-14 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white text-xl placeholder:text-white/60 focus:bg-white/20"
                                  style={{ fontSize: "16px" }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white/70"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <Input
                                  type="password"
                                  placeholder="Password"
                                  {...field}
                                  className="h-14 pl-14 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                                  style={{ fontSize: "16px" }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-white/70"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                                <Input
                                  type="password"
                                  placeholder="Confirm Password"
                                  {...field}
                                  className="h-14 pl-14 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                                  style={{ fontSize: "16px" }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => {
                          const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
                          const expectedDigits = selectedCountry?.digits || 8;
                          const phoneNumberWithoutCode = field.value?.replace(selectedCountryCode, "") || "";

                          return (
                            <FormItem>
                              <FormControl>
                                <div className="relative flex items-center gap-4">
                                  <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center z-0">
                                      <svg
                                        className="w-4 h-4 text-white/70"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                      </svg>
                                    </div>
                                    <CountryCodeSelect 
                                      value={selectedCountryCode} 
                                      onValueChange={setSelectedCountryCode}
                                    />
                                    <Input
                                      type="tel"
                                      placeholder="Phone Number"
                                      {...field}
                                      value={phoneNumberWithoutCode}
                                      onFocus={() => setIsPhoneInputFocused(true)}
                                      onBlur={() => setIsPhoneInputFocused(false)}
                                      onChange={(e) => {
                                        const inputValue = e.target.value.replace(/\D/g, ''); // Only allow digits
                                        if (inputValue.length <= expectedDigits) {
                                          const fullNumber = selectedCountryCode + inputValue;
                                          field.onChange(fullNumber);
                                        }
                                      }}
                                      className="h-14 pl-32 pr-4 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                                      style={{ fontSize: "16px" }}
                                      maxLength={expectedDigits}
                                    />
                                  </div>

                                </div>
                              </FormControl>
                              <FormMessage className="text-red-300" />
                              {/* Additional validation message */}
                              {phoneNumberWithoutCode.length > 0 && phoneNumberWithoutCode.length !== expectedDigits && (
                                <p className="text-orange-300 text-xs mt-1">
                                  {selectedCountry?.country} phone numbers should be {expectedDigits} digits
                                </p>
                              )}
                            </FormItem>
                          );
                        }}
                      />

                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white/70"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <Input
                          placeholder="SMS Verification Code"
                          className="h-14 pl-14 pr-20 rounded-full bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                          style={{ fontSize: "16px" }}
                        />
                        <Button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 px-6 rounded-full bg-white/20 hover:bg-white/30 text-white font-large"
                          style={{ fontSize: "16px" }}
                        >
                          Get
                        </Button>
                      </div>

                      <div className="flex items-center space-x-3 mt-6">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white/30 bg-white/10"
                        />
                        <span className="text-white/80 text-sm">
                          I have read and agreed to the terms and privacy
                          policy.
                        </span>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 rounded-full bg-gradient-to-r from-orange-200 to-orange-300 hover:from-pink-300 hover:to-pink-400 text-gray-800 font-semibold mt-6"
                        style={{ fontSize: '16px' }}
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating Account..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>

            {/* Helper text for username field */}
            {activeTab === "register" && isUsernameInputFocused && (
              <div className="absolute left-full ml-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90 whitespace-nowrap min-w-max z-50 flex items-center justify-center" style={{ top: '20%', transform: 'translateY(-50%)' }}>
                Please enter a 6-12 character number consisting of letters and numbers, excluding Chinese characters
              </div>
            )}

            {/* Helper text for phone field */}
            {activeTab === "register" && isPhoneInputFocused && (
              <div className="absolute left-full ml-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90 whitespace-nowrap min-w-max z-50 flex items-center justify-center" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                Please enter {(() => {
                  const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);
                  return selectedCountry?.digits || 8;
                })()} digits
              </div>
            )}

            <CardFooter className="flex justify-center pb-6">
              <p className="text-white/80 text-sm">
                {activeTab === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Button
                  variant="link"
                  className="p-0 text-amber-400 hover:text-amber-300"
                  onClick={() =>
                    setActiveTab(activeTab === "login" ? "register" : "login")
                  }
                >
                  {activeTab === "login" ? "Register" : "Login"}
                </Button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Authentication;