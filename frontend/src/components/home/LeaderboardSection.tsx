import { getLeaderboard } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import LeaderboardPreview from '../leaderboard/LeaderboardPreview';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

export default function LeaderboardSection() {
  const { data: entries } = useAsync(getLeaderboard);

  if (!entries) return null;

  return (
    <section aria-labelledby="leaderboard-title" className="gutter py-8 pb-16">
      <Reveal className="max-w-3xl">
        <SectionHeader
          variant="row"
          id="leaderboard-title"
          title="Top readers this week"
          action={{ label: 'See full leaderboard', to: '/leaderboard' }}
        />
        <div>
          <LeaderboardPreview entries={entries} />
        </div>
      </Reveal>
    </section>
  );
}
