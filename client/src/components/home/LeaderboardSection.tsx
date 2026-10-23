import { getLeaderboard } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import LeaderboardPreview from '../leaderboard/LeaderboardPreview';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

export default function LeaderboardSection() {
  const { data: entries } = useAsync(getLeaderboard);

  if (!entries) return null;

  return (
    <section aria-labelledby="leaderboard-title" className="mx-auto max-w-3xl px-4 py-10 pb-16 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader
          id="leaderboard-title"
          title="Top readers this week"
          action={{ label: 'See full leaderboard', to: '/leaderboard' }}
        />
        <LeaderboardPreview entries={entries} />
      </Reveal>
    </section>
  );
}
