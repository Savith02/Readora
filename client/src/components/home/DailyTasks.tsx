import { getDailyTasks } from '../../data/mockHome';
import { useAsync } from '../../hooks/useAsync';
import TaskCard from '../gamification/TaskCard';
import Reveal from '../ui/Reveal';
import SectionHeader from '../ui/SectionHeader';

export default function DailyTasks() {
  const { data: tasks } = useAsync(getDailyTasks);

  if (!tasks) return null;

  return (
    <section aria-labelledby="tasks-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeader
          id="tasks-title"
          title="Daily tasks"
          subtitle="Small goals, real rewards."
          action={{ label: 'View all tasks', to: '/tasks' }}
        />
        <ul className="grid gap-4 md:grid-cols-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
