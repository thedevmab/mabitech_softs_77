import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Contact"
        description="Reach the editorial and support team for partnerships, listings, or questions."
      />
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 text-sm">
        {settings.contactEmail ? (
          <p>
            <span className="text-muted">Email</span>
            <br />
            <a
              href={`mailto:${settings.contactEmail}`}
              className="font-medium text-primary hover:underline dark:text-primary"
            >
              {settings.contactEmail}
            </a>
          </p>
        ) : (
          <p className="text-muted">Contact email is not configured yet.</p>
        )}
        {settings.contactPhone ? (
          <p>
            <span className="text-muted">Phone</span>
            <br />
            <span className="font-medium text-foreground">{settings.contactPhone}</span>
          </p>
        ) : null}
        {settings.contactAddress ? (
          <p>
            <span className="text-muted">Address</span>
            <br />
            <span className="font-medium text-foreground whitespace-pre-wrap">
              {settings.contactAddress}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
