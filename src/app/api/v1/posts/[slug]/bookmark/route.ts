import { prisma } from "@/lib/db";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/request-user";
import { publicPostWhere } from "@/lib/api/serializers";

type Params = { params: Promise<{ slug: string }> };

async function findPublicPost(idOrSlug: string) {
  return prisma.post.findFirst({
    where: {
      ...publicPostWhere(),
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { slug: idOrSlug } = await params;
    const post = await findPublicPost(idOrSlug);
    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");

    await prisma.bookmark.upsert({
      where: {
        userId_postId: { userId: user.id, postId: post.id },
      },
      update: {},
      create: { userId: user.id, postId: post.id },
    });

    return jsonOk({ bookmarked: true, postId: post.id, slug: post.slug });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireApiUser(request);
    const { slug: idOrSlug } = await params;
    const post = await findPublicPost(idOrSlug);
    if (!post) throw new ApiError(404, "NOT_FOUND", "Post not found");

    await prisma.bookmark.deleteMany({
      where: { userId: user.id, postId: post.id },
    });

    return jsonOk({ bookmarked: false, postId: post.id, slug: post.slug });
  } catch (error) {
    return handleApiError(error);
  }
}
