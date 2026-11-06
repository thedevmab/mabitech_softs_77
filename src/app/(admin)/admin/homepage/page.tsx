import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_HOME_SECTIONS,
  type HomeSectionConfig,
} from "@/lib/branding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomepageManagerForm } from "@/components/admin/homepage-manager-form";
import { resetHomeSectionsAction } from "./actions";

function asSections(value: unknown): HomeSectionConfig[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_HOME_SECTIONS;
  return value as HomeSectionConfig[];
}

export default async function AdminHomepagePage() {
  await requireAdminPermission("settings.manage");
  const app = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const sections = asSections(app?.homeSections);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Homepage Manager</h2>
          <p className="text-sm text-muted">
            Control Flutter/home section visibility, order, and limits. Changes apply via{" "}
            <code className="text-xs">GET /api/v1/home</code> without an app release.
          </p>
        </div>
        <form action={resetHomeSectionsAction}>
          <Button type="submit" variant="outline">
            Reset to defaults
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <HomepageManagerForm initialSections={sections} />
        </CardContent>
      </Card>
    </div>
  );
}
