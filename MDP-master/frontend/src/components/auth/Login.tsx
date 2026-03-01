
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/authStore';

export function Login() {
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length >= 10) {
            login(phone);
            navigate('/auth/otp');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                    <CardDescription>Enter your phone number to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="text-lg"
                            />
                        </div>
                        <Button type="submit" className="w-full" size="lg">
                            Send OTP
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
