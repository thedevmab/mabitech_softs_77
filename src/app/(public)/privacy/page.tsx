import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Privacy Policy" />
      <div className="prose-tech space-y-4 text-sm">
        <p>
          {settings.platformName} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy
          explains what information we collect and how we use it.
        </p>
        <h2>Information we collect</h2>
        <p>
          Account details you provide (such as name and email), usage data needed to operate the
          service, newsletter subscriptions, and technical logs for security and reliability.
        </p>
        <h2>How we use information</h2>
        <p>
          We use data to provide and improve the platform, authenticate users, send transactional
          email, moderate content, and comply with legal obligations.
        </p>
        <h2>Sharing</h2>
        <p>
          We do not sell personal information. We may share data with infrastructure providers under
          contract, or when required by law.
        </p>
        <h2>Contact</h2>
        <p>
          Privacy questions can be sent to{" "}
          {settings.contactEmail ? (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          ) : (
            "the site administrator"
          )}
          .
        </p>
      </div>
    </div>
  );
}
