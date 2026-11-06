import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Terms of Service" />
      <div className="prose-tech space-y-4 text-sm">
        <p>
          By using {settings.platformName}, you agree to these terms. If you do not agree, do not use
          the service.
        </p>
        <h2>Accounts</h2>
        <p>
          You are responsible for safeguarding your credentials and for activity under your account.
          We may suspend accounts that violate these terms or applicable law.
        </p>
        <h2>Content and software</h2>
        <p>
          Articles and software listings are provided for informational purposes. Verification status
          reflects our review process and does not guarantee safety, fitness, or that software is
          installed on any device. You download and use third-party software at your own risk.
        </p>
        <h2>Prohibited use</h2>
        <p>
          Do not abuse the platform, attempt unauthorized access, distribute malware, scrape at
          abusive rates, or infringe intellectual property rights.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about these terms:{" "}
          {settings.contactEmail ? (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          ) : (
            "site administrator"
          )}
          .
        </p>
      </div>
    </div>
  );
}
