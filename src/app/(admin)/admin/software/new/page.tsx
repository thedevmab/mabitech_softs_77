import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { SoftwareForm } from "@/components/admin/software-form";
import { createSoftwareAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewSoftwarePage() {
  await requireAdminPermission("software.create");
  const [categories, affiliates] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.affiliateCampaign.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create software</CardTitle>
      </CardHeader>
      <CardContent>
        <SoftwareForm
          categories={categories}
          affiliates={affiliates}
          action={createSoftwareAction}
          submitLabel="Create"
        />
      </CardContent>
    </Card>
  );
}
