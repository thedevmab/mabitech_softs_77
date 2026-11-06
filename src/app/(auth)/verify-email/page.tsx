import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify email",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailAction(token)
    : { ok: false as const, message: "Missing verification token." };

  return (
    <div className="rounded-2xl border border-border bg-surface p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {result.ok ? "Email verified" : "Verification failed"}
      </h1>
      <p className="mt-2 text-sm text-muted">{result.message}</p>
      <Button asChild className="mt-6">
        <Link href="/login">Continue to sign in</Link>
      </Button>
    </div>
  );
}
