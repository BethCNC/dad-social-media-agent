import { Shield, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComplianceRule {
    text: string;
    important?: boolean;
}

interface ComplianceGuideProps {
    className?: string;
}

export const ComplianceGuide = ({ className }: ComplianceGuideProps) => {
    const doRules: ComplianceRule[] = [
        { text: 'Use "supports", "helps with", "can make it easier to"', important: true },
        { text: 'Say "link in bio" (never direct URLs in captions)', important: true },
        { text: 'Include mandatory hashtags: #metabolichealth #healthyliving #unicity', important: true },
        { text: 'Add health disclaimer at end of every post', important: true },
        { text: 'Focus on education, routines, and personal wellness journey' },
        { text: 'Keep claims realistic and modest' },
        { text: 'Identify as "Independent Unicity Distributor" in profile' },
    ];

    const dontRules: ComplianceRule[] = [
        { text: 'Never claim products cure, treat, or prevent diseases', important: true },
        { text: 'Never promise specific income or "get rich" results', important: true },
        { text: 'Never use MLM recruitment language ("join my team", "DM me for $$$")', important: true },
        { text: 'Never include direct URLs in post captions', important: true },
        { text: 'Never guarantee specific weight loss amounts or timelines' },
        { text: 'Never use disease names in claims context' },
        { text: 'Never copy official Unicity text verbatim' },
    ];

    const tiktokRules: ComplianceRule[] = [
        { text: 'Hook viewers in first 1-3 seconds or they scroll', important: true },
        { text: 'Target 15-45 seconds for optimal completion rate', important: true },
        { text: 'Include main keyword in: on-screen text, spoken audio, caption', important: true },
        { text: 'Use 4-7 hashtags total (3 brand + 1-2 specific + 1-2 broad)' },
        { text: 'Encourage saves and shares for better reach' },
        { text: 'Create recurring series for consistency' },
        { text: 'Focus on watch time and completion rate over length' },
    ];

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <CardTitle className="text-2xl">Compliance Guide</CardTitle>
                </div>
                <CardDescription>
                    Follow these rules to keep your account safe and growing
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="dos" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dos" className="gap-2">
                            <CheckCircle className="w-4 h-4" />
                            DO
                        </TabsTrigger>
                        <TabsTrigger value="donts" className="gap-2">
                            <XCircle className="w-4 h-4" />
                            DON'T
                        </TabsTrigger>
                        <TabsTrigger value="tiktok" className="gap-2">
                            <Info className="w-4 h-4" />
                            TikTok Tips
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dos" className="space-y-3 mt-4">
                        <div className="space-y-2">
                            {doRules.map((rule, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${rule.important
                                            ? 'bg-green-50 border-2 border-green-200'
                                            : 'bg-green-50/50 border border-green-100'
                                        }`}
                                >
                                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${rule.important ? 'text-green-600' : 'text-green-500'
                                        }`} />
                                    <p className={`text-sm ${rule.important ? 'font-semibold text-green-900' : 'text-green-800'
                                        }`}>
                                        {rule.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="donts" className="space-y-3 mt-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-900 text-sm mb-1">
                                        Platform Ban Risk
                                    </p>
                                    <p className="text-xs text-red-700">
                                        TikTok explicitly bans MLM promotion and restricts medical claims.
                                        Following these rules protects your account.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {dontRules.map((rule, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${rule.important
                                            ? 'bg-red-50 border-2 border-red-200'
                                            : 'bg-red-50/50 border border-red-100'
                                        }`}
                                >
                                    <XCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${rule.important ? 'text-red-600' : 'text-red-500'
                                        }`} />
                                    <p className={`text-sm ${rule.important ? 'font-semibold text-red-900' : 'text-red-800'
                                        }`}>
                                        {rule.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="tiktok" className="space-y-3 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-2">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-blue-900 text-sm mb-1">
                                        TikTok Algorithm Best Practices (2025-2026)
                                    </p>
                                    <p className="text-xs text-blue-700">
                                        TikTok rewards watch time and engagement. Follow these tips to maximize reach.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {tiktokRules.map((rule, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${rule.important
                                            ? 'bg-blue-50 border-2 border-blue-200'
                                            : 'bg-blue-50/50 border border-blue-100'
                                        }`}
                                >
                                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${rule.important ? 'text-blue-600' : 'text-blue-500'
                                        }`} />
                                    <p className={`text-sm ${rule.important ? 'font-semibold text-blue-900' : 'text-blue-800'
                                        }`}>
                                        {rule.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900 mb-2">
                        ℹ️ All Generated Content Follows These Rules
                    </p>
                    <p className="text-xs text-amber-800">
                        The app automatically enforces these compliance rules in every script, caption, and post.
                        Review each post before publishing to ensure it aligns with your voice and brand.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
