import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, Brain, Sparkles, BookOpen } from "lucide-react";
import {
    getKnowledgeItems,
    addKnowledgeItem,
    deleteKnowledgeItem,
    searchKnowledge,
    type KnowledgeItem
} from "@/lib/knowledgeApi";

export const BrandBrain = () => {
    const { toast } = useToast();
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Item Form
    const [content, setContent] = useState('');
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

    const handleAdd = async () => {
        if (!content.trim()) return;

        try {
            setIsAdding(true);
            await addKnowledgeItem({ content, source: source || undefined });

            toast({
                title: "Learned!",
                description: "Your agent has memorized this snippet.",
            });

            setContent('');
            setSource('');
            await loadItems();

        } catch (err: any) {
            toast({
                title: "Error",
                description: "Failed to add knowledge.",
                variant: "destructive"
            });
        } finally {
            setIsAdding(false);
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-2 text-fg-headings">
                    <Brain className="w-8 h-8 text-purple-500" />
                    Brand Brain
                </h1>
                <p className="text-fg-subtle text-lg">
                    Train your agent! Paste product facts, promo details, or successful scripts here.
                    The agent will "read/retrieve" this info when writing future posts.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Input */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-t-4 border-t-purple-500 shadow-sm">
                        <CardHeader>
                            <CardTitle>Teach Something New</CardTitle>
                            <CardDescription>Paste manual text, email copy, or notes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Textarea
                                    placeholder="e.g. 'Unimate is now Buy One Get One Free until Friday...' or paste a product definition."
                                    className="min-h-[150px] text-base resize-none"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div>
                                <Input
                                    placeholder="Source (optional, e.g. 'Email', 'PDF')"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAdd}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                disabled={isAdding || !content.trim()}
                            >
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Add to Memory
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 flex gap-3 text-blue-900">
                            <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">
                                <strong>Tip:</strong> The more you add, the smarter your agent gets.
                                Try adding success stories, unique product benefits, or your personal story.
                            </p>
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
