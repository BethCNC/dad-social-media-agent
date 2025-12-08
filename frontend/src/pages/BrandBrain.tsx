import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, Brain, Sparkles, BookOpen, Link as LinkIcon, Mail } from "lucide-react";
import {
    getKnowledgeItems,
    deleteKnowledgeItem,
    searchKnowledge,
    smartIngest,
    type KnowledgeItem
} from "@/lib/knowledgeApi";

export const BrandBrain = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isIngesting, setIsIngesting] = useState(false);

    // Smart Ingest Form
    const [rawInput, setRawInput] = useState('');
    const [source, setSource] = useState('');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<KnowledgeItem[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            setIsLoading(true);
            const data = await getKnowledgeItems();
            setItems(data);
        } catch (err: any) {
            toast({
                title: "Error",
                description: "Failed to load knowledge base.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSmartIngest = async () => {
        if (!rawInput.trim()) return;

        try {
            setIsIngesting(true);
            const result = await smartIngest(rawInput, source || undefined);

            toast({
                title: "Learning Complete!",
                description: `Successfully extracted and stored ${result.items_added} knowledge chunks.`,
            });

            setRawInput('');
            setSource('');
            await loadItems();

        } catch (err: any) {
            toast({
                title: "Error",
                description: err.response?.data?.detail || "Failed to extract knowledge. Try providing more specific information.",
                variant: "destructive"
            });
        } finally {
            setIsIngesting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteKnowledgeItem(id);
            setItems(items.filter(i => i.id !== id));
            toast({ title: "Deleted", description: "Memory removed." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchKnowledge(searchQuery);
            setSearchResults(results as KnowledgeItem[]); // Cast as it includes score
        } catch (err) {
            toast({ title: "Error", description: "Search failed.", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    // Detect if input looks like URL or email
    const inputType = rawInput.trim().startsWith('http') ? 'url' :
        rawInput.toLowerCase().includes('subject:') || rawInput.toLowerCase().includes('from:') ? 'email' :
            'text';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-2 text-fg-headings">
                    <Brain className="w-8 h-8 text-purple-500" />
                    Brand Brain
                </h1>
                <p className="text-fg-subtle text-lg">
                    🧠 AI-Powered Learning Agent - Paste URLs, emails, or text. The agent automatically extracts and stores knowledge.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Smart Ingest */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-t-4 border-t-purple-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Smart Learning
                            </CardTitle>
                            <CardDescription>
                                Paste a URL, email, or plain text. AI extracts the knowledge automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Textarea
                                    placeholder="Paste anything:&#10;• https://unicity.com/product-page&#10;• Promotional email text&#10;• Product facts&#10;&#10;AI will intelligently extract knowledge!"
                                    className="min-h-[200px] text-base resize-none font-mono text-sm"
                                    value={rawInput}
                                    onChange={(e) => setRawInput(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    {inputType === 'url' && (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            <LinkIcon className="w-3 h-3" />
                                            Detected URL - will scrape
                                        </div>
                                    )}
                                    {inputType === 'email' && (
                                        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                            <Mail className="w-3 h-3" />
                                            Detected Email
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Input
                                    placeholder="Source (optional, e.g. 'Promo Email Dec 8')"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleSmartIngest}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                disabled={isIngesting || !rawInput.trim()}
                            >
                                {isIngesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {isIngesting ? 'Learning...' : 'Learn & Extract'}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
                        <CardContent className="p-4 space-y-2 text-sm">
                            <div className="flex gap-2 items-start">
                                <LinkIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                                <p><strong className="text-purple-900">URLs:</strong> Scrapes official Unicity pages automatically</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                                <p><strong className="text-purple-900">Emails:</strong> Extracts promotions, dates, and key info</p>
                            </div>
                            <div className="flex gap-2 items-start">
                                <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-orange-600" />
                                <p><strong className="text-purple-900">Text:</strong> Structured knowledge from any content</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: List & Test Search */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Test what the agent knows..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Retrieval"}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-fg-headings">
                                {searchResults ? "Search Results" : "Recent Knowledge"}
                            </h2>
                            {searchResults && (
                                <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSearchResults(null); }}>
                                    Clear Search
                                </Button>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-fg-subtle" />
                            </div>
                        ) : (searchResults || items).length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-border-default rounded-lg">
                                <p className="text-fg-subtle">No knowledge found. Start teaching!</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {(searchResults || items).map((item) => (
                                    <Card key={item.id} className="group hover:border-purple-200 transition-colors">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-fg-body whitespace-pre-wrap">{item.content}</p>
                                                    <div className="flex gap-2 items-center mt-2">
                                                        {item.source && (
                                                            <span className="text-xs bg-bg-subtle px-2 py-0.5 rounded text-fg-subtle font-medium">
                                                                {item.source}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-fg-muted">
                                                            Learned {new Date(item.created_at).toLocaleDateString()}
                                                        </span>
                                                        {/* Score for search results */}
                                                        {(item as any).score && (
                                                            <span className="text-xs text-green-600 font-mono">
                                                                match: {((item as any).score * 100).toFixed(0)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="opacity-0 group-hover:opacity-100 text-fg-error hover:text-fg-error hover:bg-bg-error-subtle"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
