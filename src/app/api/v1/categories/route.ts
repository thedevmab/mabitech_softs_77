import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            posts: true,
            software: true,
          },
        },
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
            sortOrder: true,
          },
        },
      },
    });

    return jsonOk({
      items: categories
        .filter((c) => !c.parentId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          sortOrder: c.sortOrder,
          isDefault: c.isDefault,
          postCount: c._count.posts,
          softwareCount: c._count.software,
          children: c.children,
        })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
