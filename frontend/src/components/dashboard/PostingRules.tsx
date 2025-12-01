import { Shield, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export const PostingRules = () => {
    return (
        <div className="bg-bg-elevated border border-border-strong rounded-xl overflow-hidden w-full shrink-0">
            {/* Header */}
            <div className="bg-bg-action flex items-center gap-4 px-12 py-3 w-[1200px] shrink-0">
                <div className="relative shrink-0 w-[42px] h-[42px] flex items-center justify-center">
                    <Shield className="w-6 h-6 text-fg-inverse" />
                </div>
                <h2 className="text-4xl text-fg-inverse whitespace-nowrap shrink-0">
                    Posting Rules
                </h2>
            </div>

            {/* Content */}
            <div className="flex flex-col items-start p-12 shrink-0 w-full">
                <div className="flex flex-col gap-6 items-start shrink-0 w-full">
                    {/* Unicity Prohibited Terms */}
                <div className="bg-bg-error-subtle border border-border-strong rounded-lg flex flex-col gap-6 p-6">
                    <div className="flex gap-2 items-center">
                        <XCircle className="w-8 h-8 text-fg-error shrink-0" />
                        <h3 className="text-3xl font-semibold text-fg-error whitespace-nowrap">
                            Unicity Prohibited Terms
                        </h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xl text-fg-body whitespace-nowrap">
                            Never use these words:
                        </p>
                        <div className="flex gap-10 items-center">
                            <p className="text-xl font-medium text-fg-error text-center whitespace-nowrap">
                                Diabetes
                            </p>
                            <p className="text-xl font-medium text-fg-error text-center whitespace-nowrap">
                                Disease
                            </p>
                            <p className="text-xl font-medium text-fg-error text-center whitespace-nowrap">
                                Diagnosis
                            </p>
                        </div>
                    </div>
                </div>

                {/* Words to Use Instead */}
                <div className="bg-bg-success-subtle border border-border-strong rounded-lg flex flex-col gap-6 p-6">
                    <div className="flex gap-2 items-center">
                        <CheckCircle2 className="w-8 h-8 text-fg-success-hover shrink-0" />
                        <h3 className="text-3xl font-semibold text-fg-success-hover whitespace-nowrap">
                            Words to Use Instead
                        </h3>
                    </div>
                    <div className="flex gap-0 overflow-hidden rounded-lg">
                        {/* Left Column */}
                        <div className="flex-1 border border-border-default border-r-0 flex flex-col gap-3 p-6 rounded-l-lg">
                            <p className="text-xl text-fg-body">
                                Instead of <span className="font-semibold text-fg-error">cure</span>
                            </p>
                            <div className="flex gap-3 items-center px-3 py-1">
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Support
                                </span>
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Maintain
                                </span>
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Promote
                                </span>
                            </div>
                        </div>
                        {/* Right Column */}
                        <div className="flex-1 border border-border-default flex flex-col gap-3 p-6 rounded-r-lg">
                            <p className="text-xl text-fg-body">
                                Instead of <span className="font-semibold text-fg-error">weight loss</span>
                            </p>
                            <div className="flex gap-3 items-center px-3 py-1">
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Satiety
                                </span>
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Body Composition
                                </span>
                                <span className="border border-fg-success-hover rounded-full px-2 py-1 text-base font-medium text-fg-success-hover text-center whitespace-nowrap">
                                    Metabolic Health
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Income Disclosure Warning */}
                <div className="bg-bg-warning-subtle border border-border-strong rounded-lg h-[178px] flex flex-col gap-6 p-6 shrink-0 w-full">
                    <div className="flex gap-2 items-center">
                        <AlertTriangle className="w-8 h-8 text-fg-warning shrink-0" />
                        <h3 className="text-3xl font-semibold text-fg-warning whitespace-nowrap">
                            Discussing Income Opportunities or Business Claims?
                        </h3>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="text-xl text-fg-body whitespace-nowrap">
                            If you are discussing any business opportunity or income claims you MUST link the official disclosure
                        </p>
                        <a href="#" className="text-xl font-semibold text-fg-body underline w-[304px] whitespace-nowrap">
                            Get Income Disclosure Statement
                        </a>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};
