"use client";

import { useState } from "react";
import type { HomeSectionConfig } from "@/lib/branding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateHomeSectionsAction } from "@/app/(admin)/admin/homepage/actions";

export function HomepageManagerForm({
  initialSections,
}: {
  initialSections: HomeSectionConfig[];
}) {
  const [sections, setSections] = useState<HomeSectionConfig[]>(initialSections);

  function move(index: number, dir: -1 | 1) {
    const next = [...sections];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  function update(index: number, patch: Partial<HomeSectionConfig>) {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }

  return (
    <form action={updateHomeSectionsAction} className="space-y-4">
      <input type="hidden" name="sectionsJson" value={JSON.stringify(sections)} />
      {sections.map((section, index) => (
        <div
          key={section.key}
          className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-6"
        >
          <div className="sm:col-span-2 space-y-1">
            <Label>Title</Label>
            <Input
              value={section.title}
              onChange={(e) => update(index, { title: e.target.value })}
            />
            <p className="text-xs text-muted">Key: {section.key}</p>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={section.type}
              onChange={(e) =>
                update(index, {
                  type: e.target.value as HomeSectionConfig["type"],
                })
              }
            >
              <option value="posts">Posts</option>
              <option value="software">Software</option>
              <option value="sponsored">Sponsored</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Limit</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={section.limit}
              onChange={(e) => update(index, { limit: Number(e.target.value) || 8 })}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Category slugs (comma-separated)</Label>
            <Input
              value={(section.categorySlugs || []).join(", ")}
              onChange={(e) =>
                update(index, {
                  categorySlugs: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="e.g. tutorials, ai-tools"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={section.enabled}
              onChange={(e) => update(index, { enabled: e.target.checked })}
            />
            Enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(section.featured)}
              onChange={(e) => update(index, { featured: e.target.checked })}
            />
            Featured only
          </label>
          <div className="flex items-end gap-2 sm:col-span-3">
            <Button type="button" variant="outline" size="sm" onClick={() => move(index, -1)}>
              Up
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => move(index, 1)}>
              Down
            </Button>
          </div>
        </div>
      ))}
      <Button type="submit">Save homepage layout</Button>
    </form>
  );
}
