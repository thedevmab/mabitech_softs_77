import type { Metadata } from "next";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { registerAction } from "@/app/(auth)/actions";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  const settings = await getSiteSettings();

  if (!settings.registrationEnabled) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Registration closed</h1>
        <p className="mt-2 text-sm text-muted">New accounts are not being accepted right now.</p>
        <p className="mt-4 text-sm">
          <AuthLink href="/login">Sign in instead</AuthLink>
        </p>
      </div>
    );
  }

  return (
    <AuthForm
      title="Create account"
      description="Join the platform to save favorites and access member features."
      submitLabel="Create account"
      action={registerAction}
      onSuccessRedirect="/login"
      fields={[
        { name: "name", label: "Name", autoComplete: "name", placeholder: "Your name" },
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "new-password",
          placeholder: "At least 8 characters",
        },
      ]}
      footer={
        <p>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    />
  );
}
