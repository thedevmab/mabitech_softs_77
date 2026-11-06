"use server";

import { revalidatePath } from "next/cache";
import { ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";

export async function updateReportStatusAction(formData: FormData) {
  const user = await getAdminActionUser("reports.manage");
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as ReportStatus;
  if (!id || !(Object.values(ReportStatus) as string[]).includes(status)) {
    return;
  }

  await prisma.report.update({
    where: { id },
    data: { status },
  });

  await logActivity({
    userId: user.id,
    action: "reports.status.update",
    entityType: "Report",
    entityId: id,
    metadata: { status },
  });

  revalidatePath("/admin/reports");
}
