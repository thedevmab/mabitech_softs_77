import { prisma } from "@/lib/db";
import { ApiError, getPagination, handleApiError, jsonOk } from "@/lib/api";
import {
  publicPostWhere,
  publicSoftwareWhere,
  serializePost,
  serializeSoftware,
} from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPagination(searchParams);
    const include = searchParams.get("include") || "posts";

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true, icon: true, description: true },
        },
      },
    });

    if (!category) throw new ApiError(404, "NOT_FOUND", "Category not found");

    if (include === "software") {
      const where = { ...publicSoftwareWhere, categoryId: category.id };
      const [total, items] = await Promise.all([
        prisma.software.count({ where }),
        prisma.software.findMany({
          where,
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          skip,
          take: limit,
          include: {
            category: true,
            versions: { where: { isLatest: true }, take: 1 },
          },
        }),
      ]);
      return jsonOk({
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          icon: category.icon,
          parent: category.parent,
          children: category.children,
        },
        items: items.map((s) => serializeSoftware(s)),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const where = {
      ...publicPostWhere(),
      categories: { some: { categoryId: category.id } },
    };
    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          categories: { include: { category: true } },
          tags: { include: { tag: true } },
          file: true,
        },
      }),
    ]);

    return jsonOk({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        parent: category.parent,
        children: category.children,
      },
      items: posts.map((p) => serializePost(p, { includeContent: false })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
