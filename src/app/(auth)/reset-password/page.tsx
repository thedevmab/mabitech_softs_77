import type { Metadata } from "next";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Reset password",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="mt-2 text-sm text-muted">This password reset link is missing a token.</p>
        <p className="mt-4 text-sm">
          <AuthLink href="/forgot-password">Request a new link</AuthLink>
        </p>
      </div>
    );
  }

  return (
    <AuthForm
      title="Reset password"
      description="Choose a new password for your account."
      submitLabel="Update password"
      action={resetPasswordAction}
      hiddenFields={{ token }}
      onSuccessRedirect="/login"
      fields={[
        {
          name: "password",
          label: "New password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "At least 8 characters",
        },
      ]}
      footer={
        <p>
          <AuthLink href="/login">Back to sign in</AuthLink>
        </p>
      }
    />
  );
}
