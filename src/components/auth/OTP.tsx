
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function OTP() {
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock verification - accept any 4+ digit code
        if (otp.length >= 4) {
            navigate('/auth/details');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Verify Phone</CardTitle>
                    <CardDescription>Enter the code sent to your device</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="0000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="text-lg text-center tracking-widest"
                                maxLength={6}
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                (This is a mock app, enter any code)
                            </p>
                        </div>
                        <Button type="submit" className="w-full" size="lg">
                            Verify
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
