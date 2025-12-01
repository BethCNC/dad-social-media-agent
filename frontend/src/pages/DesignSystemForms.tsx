import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function DesignSystemFormsPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-fg-headings">Form controls</h1>
        <p className="text-sm text-fg-subtle">
          Inputs, labels, selects, and buttons composed into simple form patterns,
          mirroring the Figma form layouts from the Unicity design file.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Simple form</CardTitle>
            <CardDescription>Single-column layout with label, input, and helper text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Type your name" />
              <p className="text-xs text-fg-subtle">This is a helper or description text.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <Button type="submit" className="mt-2">
              Submit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form with select</CardTitle>
            <CardDescription>Input and dropdown using the same tokenized field styling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Input id="topic" placeholder="E.g. TikTok energy tips" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform">Platform</Label>
              <Select defaultValue="tiktok">
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="both">TikTok + Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit">Save</Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


