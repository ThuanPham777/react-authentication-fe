import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logoutUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { clearAllAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, Shield, Home as HomeIcon, LogIn, UserPlus } from 'lucide-react';

interface UserData {
    _id: string;
    email: string;
}

export default function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;
            const { _id } = JSON.parse(userStr);
            await logoutUser(_id);
        },
        onSettled: () => {
            clearAllAuth();
            setUser(null);
            navigate('/login', { replace: true });
        },
    });

    const handleLogout = () => logoutMutation.mutate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Navigation Bar */}
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <HomeIcon className="h-6 w-6 text-primary" />
                            <h1 className="text-xl font-bold">User Registration System</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen((o) => !o)}
                                        className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                        aria-label="User menu"
                                    >
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random&size=64`}
                                            alt="User avatar"
                                            className="h-full w-full object-cover"
                                        />
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-64 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-4 z-50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random&size=64`}
                                                        alt="User avatar"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{user.email}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">ID: {user._id}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <Button onClick={handleLogout} variant="outline" size="sm" className="w-full justify-start gap-2">
                                                    <LogOut className="h-4 w-4" />
                                                    Logout
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <LogIn className="h-4 w-4" />
                                            Login
                                        </Button>
                                    </Link>
                                    <Link to="/signup">
                                        <Button size="sm" className="gap-2">
                                            <UserPlus className="h-4 w-4" />
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-16">
                {/* Welcome Section */}
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                        {user ? `Welcome back, ${user.email.split('@')[0]}!` : 'Welcome to User Registration System'}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {user
                            ? 'You are successfully logged in. Manage your account and explore all features.'
                            : 'Get started by creating an account or signing in to access your dashboard.'}
                    </p>
                </div>

                {/* Content based on login status */}
                {user ? (
                    <>
                        {/* User Dashboard */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                            <Card className="border-primary/50 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        <CardTitle>User Profile</CardTitle>
                                    </div>
                                    <CardDescription>Your account information</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                                        <p className="text-base font-semibold">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">User ID</p>
                                        <p className="text-sm font-mono text-muted-foreground truncate">{user._id}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-green-500/50 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        <CardTitle>Authentication</CardTitle>
                                    </div>
                                    <CardDescription>Security status</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-sm font-medium">Authenticated</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        You are successfully logged in with a secure token.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-500/50 shadow-lg hover:shadow-xl transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                        <CardTitle>Welcome!</CardTitle>
                                    </div>
                                    <CardDescription>Getting started</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        You have successfully logged in to the User Registration System.
                                        Explore the features and manage your account settings.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-12 max-w-4xl mx-auto">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                    <CardDescription>Manage your account and explore features</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4">
                                        <Button variant="outline" className="flex-1 min-w-[150px]">View Profile</Button>
                                        <Button variant="outline" className="flex-1 min-w-[150px]">Edit Profile</Button>
                                        <Button variant="outline" className="flex-1 min-w-[150px]">Security Settings</Button>
                                        <Button variant="outline" className="flex-1 min-w-[150px]">Help & Support</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Guest View - Call to Action */}
                        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-12">
                            <Link to="/login">
                                <Card className="border-blue-500/50 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10">
                                                <LogIn className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Sign In</CardTitle>
                                                <CardDescription>Already have an account?</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Access your account and manage your profile with ease. Sign in to continue where you left off.
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>

                            <Link to="/signup">
                                <Card className="border-green-500/50 shadow-lg hover:shadow-xl transition-all cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-green-500/10">
                                                <UserPlus className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Sign Up</CardTitle>
                                                <CardDescription>Create a new account</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Join our community today! Create your account in seconds and start exploring all the features.
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>

                        {/* Features Section */}
                        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                            <Card className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-purple-600" />
                                        <CardTitle>Secure</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Your data is protected with enterprise-level security measures.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        <CardTitle>Personalized</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Manage your profile and customize your experience.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-green-600" />
                                        <CardTitle>Fast</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Lightning-fast performance for the best user experience.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
