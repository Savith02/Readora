import BoredomBreak from '../components/home/BoredomBreak';
import ContinueReading from '../components/home/ContinueReading';
import DailyTasks from '../components/home/DailyTasks';
import GenreRows from '../components/home/GenreRows';
import HeroSection from '../components/home/HeroSection';
import HowItWorks from '../components/home/HowItWorks';
import LeaderboardSection from '../components/home/LeaderboardSection';
import TodayProgress from '../components/home/TodayProgress';
import TopTenRow from '../components/home/TopTenRow';
import TrendingBooks from '../components/home/TrendingBooks';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ContinueReading />
      <TrendingBooks />
      <TopTenRow />
      <TodayProgress />
      <DailyTasks />
      <GenreRows />
      <BoredomBreak />
      <HowItWorks />
      <LeaderboardSection />
    </>
  );
}
