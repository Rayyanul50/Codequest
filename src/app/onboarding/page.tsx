import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Onboarding } from "@/components/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboarded) redirect("/dashboard");
  return <Onboarding username={user.username} />;
}
