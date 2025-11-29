import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ComplianceQuickRef = () => {
    return (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-base">Critical: Avoid Account Bans</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">Never Say:</p>
                        <ul className="space-y-1 text-xs text-red-800">
                            <li>• "Cures", "treats", "fixes" diseases</li>
                            <li>• "Make $X" or income promises</li>
                            <li>• "Join my team" (MLM banned)</li>
                            <li>• Direct URLs in captions</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-green-900 uppercase tracking-wide">Always Include:</p>
                        <ul className="space-y-1 text-xs text-green-800">
                            <li>• "Link in bio" (not direct URLs)</li>
                            <li>• #metabolichealth #healthyliving #unicity</li>
                            <li>• Health disclaimer at end</li>
                            <li>• "supports", "helps with" language</li>
                        </ul>
                    </div>
                </div>
                <div className="pt-2 border-t border-red-200">
                    <p className="text-xs text-red-700">
                        <Shield className="w-3 h-3 inline mr-1" />
                        All generated content follows these rules automatically
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
