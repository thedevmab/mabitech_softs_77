import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { formatBytes } from "@/lib/utils";
import { SoftwareForm } from "@/components/admin/software-form";
import { SoftwareUploadForm } from "@/components/admin/software-upload";
import {
  updateSoftwareAction,
  deleteSoftwareAction,
  verifySoftwareAction,
  rejectSoftwareAction,
  verifyFileAction,
  rejectFileAction,
} from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function EditSoftwarePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("software.edit");
  const { id } = await params;

  const [software, categories, affiliates] = await Promise.all([
    prisma.software.findFirst({
      where: { id, deletedAt: null },
      include: {
        files: { orderBy: { createdAt: "desc" } },
        verifiedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.affiliateCampaign.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!software) notFound();

  const update = updateSoftwareAction.bind(null, software.id);
  const remove = deleteSoftwareAction.bind(null, software.id);
  const verify = verifySoftwareAction.bind(null, software.id);
  const reject = rejectSoftwareAction.bind(null, software.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Edit software</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Verification: {software.verificationStatus}
              {software.verifiedBy
                ? ` · by ${software.verifiedBy.name || software.verifiedBy.email}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={verify}>
              <Button type="submit" size="sm">
                Verify
              </Button>
            </form>
            <form action={reject} className="flex gap-2">
              <Input name="reason" placeholder="Reject reason" className="h-8 w-40" />
              <Button type="submit" size="sm" variant="destructive">
                Reject
              </Button>
            </form>
            <form action={remove}>
              <Button type="submit" size="sm" variant="outline">
                Delete
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          <SoftwareForm
            categories={categories}
            affiliates={affiliates}
            action={update}
            submitLabel="Update software"
            initial={{
              name: software.name,
              slug: software.slug,
              shortDescription: software.shortDescription || "",
              description: software.description,
              iconUrl: software.iconUrl || "",
              coverUrl: software.coverUrl || "",
              developerName: software.developerName || "",
              officialWebsite: software.officialWebsite || "",
              categoryId: software.categoryId || "",
              supportedOs: software.supportedOs.join(", "),
              minAndroidVersion: software.minAndroidVersion || "",
              channel: software.channel,
              externalUrl: software.externalUrl || "",
              googlePlayUrl: software.googlePlayUrl || "",
              isFree: software.isFree,
              isPremium: software.isPremium,
              isFeatured: software.isFeatured,
              status: software.status,
              screenshots: software.screenshots.join(", "),
              affiliateCampaignId: software.affiliateCampaignId || "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SoftwareUploadForm softwareId={software.id} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr>
                  <th className="pb-2 pr-3">File</th>
                  <th className="pb-2 pr-3">Size</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Uploaded</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {software.files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-muted">
                      No files uploaded
                    </td>
                  </tr>
                ) : (
                  software.files.map((file) => (
                    <tr key={file.id}>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-foreground">{file.originalName}</div>
                        <div className="text-xs text-muted">{file.extension}</div>
                      </td>
                      <td className="py-2 pr-3 text-muted">{formatBytes(file.sizeBytes)}</td>
                      <td className="py-2 pr-3 text-xs">{file.verificationStatus}</td>
                      <td className="py-2 pr-3 text-muted">
                        {format(file.createdAt, "MMM d, yyyy")}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <form action={verifyFileAction.bind(null, file.id)}>
                            <Button type="submit" size="sm" variant="secondary">
                              Verify
                            </Button>
                          </form>
                          <form action={rejectFileAction.bind(null, file.id)}>
                            <Button type="submit" size="sm" variant="destructive">
                              Reject
                            </Button>
                          </form>
                        </div>
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
