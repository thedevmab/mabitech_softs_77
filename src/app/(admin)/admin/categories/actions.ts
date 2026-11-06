"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { makeSlug } from "@/lib/utils";
import { getAdminActionUser } from "@/lib/admin/auth";
import { logActivity } from "@/lib/audit";
import { ApiError } from "@/lib/api";

export async function createCategoryAction(formData: FormData) {
  const user = await getAdminActionUser("categories.manage");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const icon = String(formData.get("icon") || "").trim() || null;
  if (!name) throw new ApiError(400, "VALIDATION", "Name is required");

  let slug = makeSlug(name);
  if (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const maxSort = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      icon,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isDefault: false,
    },
  });

  await logActivity({
    userId: user.id,
    action: "categories.create",
    entityType: "Category",
    entityId: category.id,
  });
  revalidatePath("/admin/categories");
}

export async function reorderCategoryAction(formData: FormData) {
  const user = await getAdminActionUser("categories.manage");
  const id = String(formData.get("id") || "");
  const direction = String(formData.get("direction") || "");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "NOT_FOUND", "Category not found");

  const swapWith = await prisma.category.findFirst({
    where:
      direction === "up"
        ? { sortOrder: { lt: category.sortOrder } }
        : { sortOrder: { gt: category.sortOrder } },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
  });
  if (!swapWith) return;

  await prisma.$transaction([
    prisma.category.update({
      where: { id: category.id },
      data: { sortOrder: swapWith.sortOrder },
    }),
    prisma.category.update({
      where: { id: swapWith.id },
      data: { sortOrder: category.sortOrder },
    }),
  ]);

  await logActivity({
    userId: user.id,
    action: "categories.reorder",
    entityType: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await getAdminActionUser("categories.manage");
  const id = String(formData.get("id") || "");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "NOT_FOUND", "Category not found");
  if (category.isDefault) {
    throw new ApiError(400, "DEFAULT_CATEGORY", "Default categories cannot be deleted");
  }
  await prisma.$transaction([
    prisma.software.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
    prisma.postCategory.deleteMany({ where: { categoryId: id } }),
    prisma.category.delete({ where: { id } }),
  ]);
  await logActivity({
    userId: user.id,
    action: "categories.delete",
    entityType: "Category",
    entityId: id,
  });
  revalidatePath("/admin/categories");
}
