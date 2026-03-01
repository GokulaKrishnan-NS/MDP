
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/authStore';

export function UserDetails() {
    const navigate = useNavigate();
    const updateUser = useAuthStore((state) => state.updateUser);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        emergencyName: '',
        emergencyPhone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({
            name: formData.name,
            address: formData.address,
            emergencyContact: {
                name: formData.emergencyName,
                phone: formData.emergencyPhone,
            },
        });
        navigate('/auth/permissions');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Your Details</CardTitle>
                    <CardDescription>Please tell us a bit about yourself</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>

                        <div className="pt-4 pb-2">
                            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Emergency Contact</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergencyName">Contact Name</Label>
                            <Input
                                id="emergencyName"
                                value={formData.emergencyName}
                                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergencyPhone">Contact Phone</Label>
                            <Input
                                id="emergencyPhone"
                                type="tel"
                                value={formData.emergencyPhone}
                                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full mt-4" size="lg">
                            Next
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
