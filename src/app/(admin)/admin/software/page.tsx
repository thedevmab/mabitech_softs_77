import Link from "next/link";
import { format } from "date-fns";
import { SoftwareStatus, VerificationStatus } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminSoftwarePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; verification?: string; category?: string }>;
}) {
  await requireAdminPermission("software.view");
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const categorySlug = params.category?.trim() || "";
  const status =
    params.status && (Object.values(SoftwareStatus) as string[]).includes(params.status)
      ? (params.status as SoftwareStatus)
      : undefined;
  const verification =
    params.verification &&
    (Object.values(VerificationStatus) as string[]).includes(params.verification)
      ? (params.verification as VerificationStatus)
      : undefined;

  const heading =
    categorySlug === "ai-tools" || categorySlug === "artificial-intelligence"
      ? "AI Tools"
      : "Software Downloads";

  const aiSlugs = ["ai-tools", "artificial-intelligence"];

  const items = await prisma.software.findMany({
    where: {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(verification ? { verificationStatus: verification } : {}),
      ...(categorySlug
        ? {
            category: {
              slug: {
                in:
                  categorySlug === "ai-tools" || categorySlug === "artificial-intelligence"
                    ? aiSlugs
                    : [categorySlug],
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { category: true, _count: { select: { files: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{heading}</h2>
          <p className="text-sm text-muted">
            {items.length} results
            {categorySlug ? ` · category: ${categorySlug}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/software/new">New software</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-3">
            <Input name="q" placeholder="Search" defaultValue={q} className="max-w-xs" />
            <Input
              name="category"
              placeholder="Category slug"
              defaultValue={categorySlug}
              className="max-w-xs"
            />
            <select
              name="status"
              defaultValue={status || ""}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">All statuses</option>
              {Object.values(SoftwareStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="verification"
              defaultValue={verification || ""}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
            >
              <option value="">All verification</option>
              {Object.values(VerificationStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Files</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-muted">
                      No software found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-muted">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/software/${item.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs">{item.status}</td>
                      <td className="px-4 py-3 text-xs">{item.verificationStatus}</td>
                      <td className="px-4 py-3">{item._count.files}</td>
                      <td className="px-4 py-3 text-muted">
                        {format(item.updatedAt, "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
