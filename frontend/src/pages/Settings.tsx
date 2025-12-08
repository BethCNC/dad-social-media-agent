import { useState, useEffect } from 'react';

import { Save, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface ClientProfile {
    brandName: string;
    defaultReferralUrl: string;
    tone: {
        overall: string;
        readingLevel: string;
        personPerspective: string;
    };
    compliance: {
        sources: string[];
        rules: {
            noDiseaseClaims: boolean;
            noGuaranteedIncome: boolean;
            alwaysIncludeHealthDisclaimer: boolean;
            avoidCopyingOfficialTextVerbatim: boolean;
        };
    };
    products: Record<string, {
        label: string;
        primaryUrl: string;
        focus: string[];
    }>;
    hashtags: {
        general: string[];
        maxExtraPerPost: number;
    };
    disclaimers: {
        health: string;
        general: string;
    };
}

export const SettingsPage = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<ClientProfile | null>(null);

    // We'll manage form state manually for nested objects simplicity in this MVP
    // Ideally use react-hook-form with nested paths, but a simple state merge works for now.

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<ClientProfile>('/api/settings');
            setProfile(response.data);
        } catch (err: any) {
            toast({
                title: "Error loading settings",
                description: err.response?.data?.detail || "Could not load profile configuration.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        try {
            setIsSaving(true);
            await api.put('/api/settings', profile);
            toast({
                title: "Settings saved",
                description: "Your profile configuration has been updated.",
            });
        } catch (err: any) {
            toast({
                title: "Error saving settings",
                description: err.response?.data?.detail || "Failed to update profile.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to update nested state
    const updateProfile = (path: string[], value: any) => {
        setProfile(prev => {
            if (!prev) return null;
            const newProfile = { ...prev };

            let current: any = newProfile;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;

            return newProfile;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-fg-subtle text-lg">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-fg-headings">Settings</h1>
                    <p className="text-fg-subtle mt-2">
                        Configure your brand voice, referral links, and compliance rules.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Core Brand Identity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Brand Identity</CardTitle>
                        <CardDescription>Basic information about how you present yourself.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="brandName">Brand Name</Label>
                            <Input
                                id="brandName"
                                value={profile.brandName}
                                onChange={(e) => updateProfile(['brandName'], e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tone-overall">Voice & Tone</Label>
                            <Textarea
                                id="tone-overall"
                                value={profile.tone.overall}
                                onChange={(e) => updateProfile(['tone', 'overall'], e.target.value)}
                                placeholder="e.g. Friendly, educational, supportive..."
                            />
                            <p className="text-xs text-fg-subtle">How the AI should sound when writing scripts.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Links & Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Referral Links</CardTitle>
                        <CardDescription>
                            Your personal Unicity links. The AI will never post these directly in captions (to stay compliant),
                            but it helps to have them on hand.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="defaultReferralUrl" className="flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> Default Shop Link
                            </Label>
                            <Input
                                id="defaultReferralUrl"
                                value={profile.defaultReferralUrl}
                                onChange={(e) => updateProfile(['defaultReferralUrl'], e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border-default">
                            <h3 className="text-sm font-semibold text-fg-headings">Product Links</h3>
                            {Object.entries(profile.products).map(([key, product]) => (
                                <div key={key} className="grid gap-2 p-3 bg-bg-subtle rounded-lg border border-border-default">
                                    <Label htmlFor={`prod-${key}`} className="font-medium">{product.label}</Label>
                                    <Input
                                        id={`prod-${key}`}
                                        value={product.primaryUrl}
                                        onChange={(e) => {
                                            // Deep update needed for product map
                                            const newProducts = { ...profile.products };
                                            newProducts[key] = { ...newProducts[key], primaryUrl: e.target.value };
                                            updateProfile(['products'], newProducts);
                                        }}
                                        placeholder="https://..."
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance & Disclaimers */}
                <Card className="border-border-default">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-fg-warning" />
                            Compliance & Disclaimers
                        </CardTitle>
                        <CardDescription>
                            Texts that are automatically appended to your posts for safety.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="health-disclaimer">Health Disclaimer (Appended to Captions)</Label>
                            <Textarea
                                id="health-disclaimer"
                                value={profile.disclaimers.health}
                                onChange={(e) => updateProfile(['disclaimers', 'health'], e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="hashtags">Brand Hashtags (Comma separated)</Label>
                            <Input
                                id="hashtags"
                                value={profile.hashtags.general.join(', ')}
                                onChange={(e) => {
                                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                    updateProfile(['hashtags', 'general'], tags);
                                }}
                            />
                            <p className="text-xs text-fg-subtle">These tags are added to every generated post.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
