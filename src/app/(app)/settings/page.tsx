import { requireUser } from "@/lib/auth";
import { Container } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";

export default async function Settings() {
  const user = await requireUser();
  return (
    <Container>
      <PageHeader title="Settings" subtitle="Manage your profile, preferences and account." />
      <SettingsForm username={user.username} email={user.email} isAdmin={user.role === "ADMIN"} />
    </Container>
  );
}
