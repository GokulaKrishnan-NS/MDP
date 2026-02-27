
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function OTP() {
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();

    // FIX: Changed from form onSubmit to direct onClick handler.
    // On Android WebView (Capacitor), the virtual keyboard can suppress form submit events.
    // Using onClick directly on the button is more reliable for mobile.
    const handleVerify = () => {
        if (otp.length < 4) {
            toast.error('Please enter at least 4 digits');
            return;
        }
        // Mock verification — accept any 4+ digit code
        navigate('/auth/details');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Verify Phone</CardTitle>
                    <CardDescription>Enter the code sent to your device</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="number"
                                inputMode="numeric"
                                placeholder="0000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="text-lg text-center tracking-widest"
                                maxLength={6}
                                autoComplete="one-time-code"
                            />
                            <p className="text-xs text-muted-foreground text-center">
                                (This is a mock app — enter any 4+ digit code)
                            </p>
                        </div>
                        {/* FIX: type="button" prevents implicit form submit; onClick fires reliably */}
                        <Button
                            type="button"
                            className="w-full"
                            size="lg"
                            onClick={handleVerify}
                        >
                            Verify
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
