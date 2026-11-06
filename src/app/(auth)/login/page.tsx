import type { Metadata } from "next";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { loginAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign in",
};

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/admin";

  return (
    <AuthForm
      title="Sign in"
      description="Welcome back. Use your email and password."
      submitLabel="Sign in"
      action={loginAction}
      onSuccessRedirect={redirectTo}
      fields={[
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
          autoComplete: "current-password",
        },
      ]}
      footer={
        <p className="space-x-1">
          <span>No account?</span>
          <AuthLink href="/register">Create one</AuthLink>
          <span>·</span>
          <AuthLink href="/forgot-password">Forgot password</AuthLink>
        </p>
      }
    />
  );
}
