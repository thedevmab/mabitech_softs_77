import { requireAdminPermission } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { PostForm } from "@/components/admin/post-form";
import { createPostAction } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewPostPage() {
  await requireAdminPermission("posts.create");
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create post</CardTitle>
      </CardHeader>
      <CardContent>
        <PostForm categories={categories} action={createPostAction} submitLabel="Create post" />
      </CardContent>
    </Card>
  );
}
