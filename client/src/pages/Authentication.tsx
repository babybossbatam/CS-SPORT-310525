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
import Header from '@/components/layout/Header';
import SportsCategoryTabs from '@/components/layout/SportsCategoryTabs';

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
      fullName: ''
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

      navigate('/');
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
        description: `Welcome to 365Scores, ${newUser.username}!`
      });

      navigate('/');
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
    <>
      <Header />
      <SportsCategoryTabs />

      <div className="container mx-auto px-4 py-8 max-w-md mt-16">
        <Card className="w-full p-2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">CS SPORT</CardTitle>
            <CardDescription className="text-center">
              {activeTab === 'login'
                ? 'Sign in to your account to access your favorites'
                : 'Create a new account to personalize your experience'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthMode)}>
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-[#3182CE]" disabled={isLoading}>
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
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be your display name
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 6 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="passwordConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-[#3182CE]" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              {activeTab === 'login'
                ? "Don't have an account? "
                : "Already have an account? "
              }
              <Button 
                variant="link" 
                className="p-0 text-[#3182CE]" 
                onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
              >
                {activeTab === 'login' ? 'Register' : 'Login'}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Authentication;