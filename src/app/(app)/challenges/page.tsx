import { requireUser } from "@/lib/auth";
import { getJourney } from "@/lib/queries";
import { Container } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { ChallengeList } from "@/components/challenge-list";

export default async function Challenges() {
  const user = await requireUser();
  const worlds = await getJourney(user.id);
  const rows = worlds.flatMap((w) => w.problems.map((p) => ({ ...p, world: w.name })));
  const topics = Array.from(new Set(rows.map((r) => r.topic)));
  return (
    <Container>
      <PageHeader title="Challenges" subtitle="Every challenge in one list. Locked ones open as you progress along your journey." />
      <ChallengeList rows={rows} topics={topics} />
    </Container>
  );
}
