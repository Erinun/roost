import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
    Calendar,
    CalendarDays,
    CheckSquare,
    Loader2,
    MessageCircleQuestion,
    Newspaper,
} from 'lucide-react';
import { getMeetings } from '@/services/association-meetings';
import { getTasks } from '@/services/association-tasks';
import { getActivities, getNews, getQuestions } from '@/services/association-portal';
import type { WorkspaceContext } from '../AssociationWorkspace';
import type {
    AssociationActivity,
    AssociationMeeting,
    AssociationTask,
    MemberNews,
} from '@/types/association';
import { formatDateTime, isOverdue } from './shared';

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('sv-SE');
}

interface OverviewCardProps {
    title: string;
    icon: React.ReactNode;
    linkTo: string;
    linkLabel: string;
    children: React.ReactNode;
}

function OverviewCard({ title, icon, linkTo, linkLabel, children }: OverviewCardProps) {
    return (
        <section className="card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-semibold text-surface-900 dark:text-surface-50">
                    {icon}
                    {title}
                </h3>
                <Link to={linkTo} className="link text-sm whitespace-nowrap">
                    {linkLabel}
                </Link>
            </div>
            {children}
        </section>
    );
}

export default function WorkspaceOverview() {
    const { association } = useOutletContext<WorkspaceContext>();
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [upcomingMeetings, setUpcomingMeetings] = useState<AssociationMeeting[]>([]);
    const [openTasks, setOpenTasks] = useState<AssociationTask[]>([]);
    const [upcomingActivities, setUpcomingActivities] = useState<AssociationActivity[]>([]);
    const [latestNews, setLatestNews] = useState<MemberNews[]>([]);
    const [openQuestionCount, setOpenQuestionCount] = useState(0);

    useEffect(() => {
        const fetchOverview = async () => {
            setIsLoading(true);
            setLoadError(null);

            const [meetingsResult, tasksResult, activitiesResult, newsResult, questionsResult] =
                await Promise.allSettled([
                    getMeetings(association.id),
                    getTasks(association.id),
                    getActivities(association.id, { upcomingOnly: true }),
                    getNews(association.id),
                    getQuestions(association.id),
                ]);

            if (meetingsResult.status === 'fulfilled') {
                const now = Date.now();
                setUpcomingMeetings(
                    meetingsResult.value
                        .filter(m => new Date(m.meeting_date).getTime() >= now)
                        .sort(
                            (a, b) =>
                                new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
                        )
                        .slice(0, 3)
                );
            }
            if (tasksResult.status === 'fulfilled') {
                setOpenTasks(tasksResult.value.filter(t => t.status !== 'done').slice(0, 5));
            }
            if (activitiesResult.status === 'fulfilled') {
                setUpcomingActivities(activitiesResult.value.slice(0, 3));
            }
            if (newsResult.status === 'fulfilled') {
                setLatestNews(
                    [...newsResult.value]
                        .sort(
                            (a, b) =>
                                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )
                        .slice(0, 3)
                );
            }
            if (questionsResult.status === 'fulfilled') {
                setOpenQuestionCount(questionsResult.value.filter(q => q.status === 'open').length);
            }

            const results = [meetingsResult, tasksResult, activitiesResult, newsResult, questionsResult];
            let hasError = false;
            for (const result of results) {
                if (result.status === 'rejected') {
                    hasError = true;
                    console.error('Error fetching workspace overview:', result.reason);
                }
            }
            if (hasError) {
                setLoadError('Det gick inte att ladda hela översikten. Försök igen.');
            }

            setIsLoading(false);
        };

        fetchOverview();
    }, [association.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-4">
                Vad händer just nu?
            </h2>

            {loadError && <div className="alert-error mb-4">{loadError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kommande möten */}
                <OverviewCard
                    title="Kommande möten"
                    icon={<Calendar className="w-5 h-5 text-primary-600 dark:text-primary-300" />}
                    linkTo="meetings"
                    linkLabel="Visa alla"
                >
                    {upcomingMeetings.length === 0 ? (
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Inga kommande möten.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {upcomingMeetings.map(meeting => (
                                <li key={meeting.id}>
                                    <Link
                                        to={`meetings/${meeting.id}`}
                                        className="block rounded-lg border border-surface-200 dark:border-surface-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                                            {meeting.title}
                                        </p>
                                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                            {formatDateTime(meeting.meeting_date)}
                                            {meeting.location && ` · ${meeting.location}`}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </OverviewCard>

                {/* Öppna uppgifter */}
                <OverviewCard
                    title="Öppna uppgifter"
                    icon={<CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-300" />}
                    linkTo="tasks"
                    linkLabel="Visa alla"
                >
                    {openTasks.length === 0 ? (
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Inga öppna uppgifter.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {openTasks.map(task => {
                                const overdue = isOverdue(task);
                                return (
                                    <li
                                        key={task.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 dark:border-surface-700 p-3"
                                    >
                                        <span className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                                            {task.title}
                                        </span>
                                        {task.due_date && (
                                            <span
                                                className={`text-xs whitespace-nowrap ${overdue
                                                    ? 'text-error-strong dark:text-error-soft font-semibold'
                                                    : 'text-surface-500 dark:text-surface-400'
                                                    }`}
                                            >
                                                {formatDate(task.due_date)}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </OverviewCard>

                {/* Kommande aktiviteter */}
                <OverviewCard
                    title="Kommande aktiviteter"
                    icon={<CalendarDays className="w-5 h-5 text-primary-600 dark:text-primary-300" />}
                    linkTo="activities"
                    linkLabel="Visa alla"
                >
                    {upcomingActivities.length === 0 ? (
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Inga kommande aktiviteter.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {upcomingActivities.map(activity => (
                                <li
                                    key={activity.id}
                                    className="rounded-lg border border-surface-200 dark:border-surface-700 p-3"
                                >
                                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                                        {formatDateTime(activity.starts_at)}
                                        {activity.location && ` · ${activity.location}`}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </OverviewCard>

                {/* Senaste nyheter */}
                <OverviewCard
                    title="Senaste nyheter"
                    icon={<Newspaper className="w-5 h-5 text-primary-600 dark:text-primary-300" />}
                    linkTo="news"
                    linkLabel="Visa alla"
                >
                    {latestNews.length === 0 ? (
                        <p className="text-sm text-surface-600 dark:text-surface-300">
                            Inga nyheter än.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {latestNews.map(news => (
                                <li
                                    key={news.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 dark:border-surface-700 p-3"
                                >
                                    <p className="text-sm font-medium text-surface-900 dark:text-surface-50 truncate">
                                        {news.title}
                                    </p>
                                    <span
                                        className={
                                            news.status === 'published'
                                                ? 'badge-success'
                                                : 'badge bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-300'
                                        }
                                    >
                                        {news.status === 'published' ? 'Publicerad' : 'Utkast'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </OverviewCard>
            </div>

            {/* Öppna frågor */}
            <div className="mt-4">
                <Link
                    to="questions"
                    className="card-hover p-5 flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-3">
                        <MessageCircleQuestion className="w-5 h-5 text-primary-600 dark:text-primary-300" />
                        <span className="font-semibold text-surface-900 dark:text-surface-50">
                            Öppna frågor från medlemmar
                        </span>
                    </div>
                    <span className="badge-primary">{openQuestionCount}</span>
                </Link>
            </div>
        </div>
    );
}
