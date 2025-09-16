
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useDispatch } from 'react-redux';
import { userActions } from '@/lib/store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Extend the user schema with login validation
const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(6, 'Password is required')
});

// Extend the insertUserSchema with password confirmation
const registerSchema = insertUserSchema.extend({
  passwordConfirm: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

type AuthMode = 'login' | 'register';

interface AuthenticationProps {
  mode?: AuthMode;
}

const Authentication = ({ mode = 'login' }: AuthenticationProps) => {
  const [activeTab, setActiveTab] = useState<AuthMode>(mode);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const dispatch = useDispatch();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirm: '',
      fullName: '',
      phoneNumber: ''
    }
  });

  // Handle login submission
  const onLoginSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const userData = await response.json();

      dispatch(userActions.setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email
      }));

      // Get user preferences
      try {
        const prefsResponse = await apiRequest('GET', `/api/user/${userData.id}/preferences`);
        const prefsData = await prefsResponse.json();

        dispatch(userActions.setUserPreferences({
          favoriteTeams: prefsData.favoriteTeams || [],
          favoriteLeagues: prefsData.favoriteLeagues || [],
          favoriteMatches: prefsData.favoriteMatches || [],
          region: prefsData.region || 'global'
        }));
      } catch (error) {
        console.error('Failed to fetch user preferences:', error);
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.username}!`
      });

      // Extract current language from URL or default to 'en'
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const currentLang = pathParts[0] || 'en';
      
      navigate(`/${currentLang}`);
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password',
        variant: 'destructive'
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
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();

      dispatch(userActions.setUser({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }));

      // Set default preferences
      dispatch(userActions.setUserPreferences({
        favoriteTeams: [],
        favoriteLeagues: [],
        favoriteMatches: [],
        region: 'global'
      }));

      toast({
        title: 'Registration Successful',
        description: `Welcome to CS Sport, ${newUser.username}!`
      });

      // Extract current language from URL or default to 'en'
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/').filter(part => part);
      const currentLang = pathParts[0] || 'en';
      
      navigate(`/${currentLang}`);
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: 'Registration Failed',
        description: 'There was an error creating your account. Please try again.',
        variant: 'destructive'
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
          style={{ filter: 'brightness(0.7)' }}
        >
          <source src="https://www.csbet.vip/assets/videos/football-bg.mp4" type="video/mp4" />
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
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <CardDescription className="text-white/90 text-lg">
                {activeTab === 'login'
                  ? 'Sign in to your account to access your favorites'
                  : 'Create a new account to personalize your experience'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthMode)}>
                <TabsList className="grid grid-cols-2 mb-6 bg-white/20 backdrop-blur-sm">
                  <TabsTrigger 
                    value="login" 
                    className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
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
                            <FormLabel className="text-white">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 mt-6" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="johndoe" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormDescription className="text-white/70 text-sm">
                              This will be your display name
                            </FormDescription>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="john.doe@example.com" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                placeholder="+1 (555) 123-4567" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
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
                            <FormLabel className="text-white">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormDescription className="text-white/70 text-sm">
                              Must be at least 6 characters
                            </FormDescription>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
                              />
                            </FormControl>
                            <FormMessage className="text-red-300" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3 mt-6" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-center pb-6">
              <p className="text-white/80 text-sm">
                {activeTab === 'login'
                  ? "Don't have an account? "
                  : "Already have an account? "
                }
                <Button 
                  variant="link" 
                  className="p-0 text-amber-400 hover:text-amber-300" 
                  onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                >
                  {activeTab === 'login' ? 'Register' : 'Login'}
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
