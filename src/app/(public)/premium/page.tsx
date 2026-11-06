import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/public/empty-state";
import { PageHeader } from "@/components/public/page-header";
import { SoftwareCard } from "@/components/public/software-card";
import { Button } from "@/components/ui/button";
import { getPublishedSoftware, getSubscriptionPlans } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Premium",
  description: "Premium plans and exclusive software resources.",
};

export default async function PremiumPage() {
  const [plans, premiumSoftware] = await Promise.all([
    getSubscriptionPlans(),
    getPublishedSoftware({ take: 12, premium: true }),
  ]);

  const paidPlans = plans.filter((p) => !p.isFree);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Premium"
        description="Unlock exclusive resources and member benefits. Sign in to manage your subscription."
      />

      {paidPlans.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-6"
            >
              <h2 className="text-xl font-semibold tracking-tight">{plan.name}</h2>
              {plan.description ? <p className="mt-2 text-sm text-muted">{plan.description}</p> : null}
              <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                {(plan.priceCents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: plan.currency,
                })}
                <span className="text-sm font-normal text-muted"> / {plan.intervalDays} days</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-primary dark:text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-auto pt-6">
                <Link href="/register">Get started</Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Plans coming soon"
          description="Subscription plans will appear here once configured."
        />
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Premium resources</h2>
        {premiumSoftware.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {premiumSoftware.map((item) => (
              <SoftwareCard key={item.id} software={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="No premium software yet" />
        )}
      </section>
    </div>
  );
}
