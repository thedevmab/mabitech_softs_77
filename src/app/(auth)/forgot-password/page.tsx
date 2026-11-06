import type { Metadata } from "next";
import { AuthForm, AuthLink } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      title="Forgot password"
      description="Enter your email and we'll send a reset link if an account exists."
      submitLabel="Send reset link"
      action={forgotPasswordAction}
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@example.com",
        },
      ]}
      footer={
        <p>
          Remembered it? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    />
  );
}
