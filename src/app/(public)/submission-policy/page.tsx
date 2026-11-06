import type { Metadata } from "next";
import { PageHeader } from "@/components/public/page-header";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Submission Policy",
};

export default async function SubmissionPolicyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Submission Policy" />
      <div className="prose-tech space-y-4 text-sm">
        <p>
          {settings.platformName} accepts software and content submissions subject to editorial
          review.
        </p>
        <h2>Eligibility</h2>
        <p>
          Submissions must be lawful, accurately described, free of malware, and accompanied by a
          clear distribution channel (hosted file, external URL, or Google Play).
        </p>
        <h2>Review</h2>
        <p>
          We may scan files, request additional documentation, reject listings, or mark verification
          status as pending, verified, rejected, or infected. Publication is not guaranteed.
        </p>
        <h2>Accuracy</h2>
        <p>
          Submitters must not misrepresent ownership, licensing, version numbers, or installation
          claims. We display verification and channel information; we never claim software is
          installed on user devices.
        </p>
        <h2>Contact</h2>
        <p>
          To discuss a submission, contact{" "}
          {settings.contactEmail ? (
            <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
          ) : (
            "the editorial team"
          )}
          .
        </p>
      </div>
    </div>
  );
}
