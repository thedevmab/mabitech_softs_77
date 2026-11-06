import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ isFree: "desc" }, { priceCents: "asc" }],
    });

    return jsonOk({
      items: plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        currency: p.currency,
        intervalDays: p.intervalDays,
        features: p.features,
        isFree: p.isFree,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
