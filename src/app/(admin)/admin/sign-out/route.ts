import { signOut } from "@/lib/auth/config";

export async function POST() {
  await signOut({ redirectTo: "/login" });
}

export async function GET() {
  await signOut({ redirectTo: "/login" });
}
