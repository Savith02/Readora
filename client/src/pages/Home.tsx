import BoredomBreak from '../components/home/BoredomBreak';
import ContinueReading from '../components/home/ContinueReading';
import DailyTasks from '../components/home/DailyTasks';
import HeroSection from '../components/home/HeroSection';
import HowItWorks from '../components/home/HowItWorks';
import LeaderboardSection from '../components/home/LeaderboardSection';
import TodayProgress from '../components/home/TodayProgress';
import TrendingBooks from '../components/home/TrendingBooks';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ContinueReading />
      <TodayProgress />
      <DailyTasks />
      <TrendingBooks />
      <BoredomBreak />
      <HowItWorks />
      <LeaderboardSection />
    </>
  );
}
