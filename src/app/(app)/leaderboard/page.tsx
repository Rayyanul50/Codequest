import { requireUser } from "@/lib/auth";
import { getLeaderboard } from "@/lib/queries";
import { Container } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { LeaderboardTabs } from "@/components/leaderboard-tabs";

export default async function Leaderboard() {
  const user = await requireUser();
  const [weekly, all] = await Promise.all([getLeaderboard("weekly", user.id), getLeaderboard("all", user.id)]);
  return (
    <Container>
      <PageHeader title="Leaderboard" subtitle="Weekly rankings reset every Monday. All-time never forgets." />
      <LeaderboardTabs weekly={weekly} all={all} />
    </Container>
  );
}
