import { BookOpen, FileText, Video } from 'lucide-react';
import type { TabValue } from './GroupTabs';

export interface Tab {
    value: TabValue;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const groupTabs: Tab[] = [
    { value: 'feed', label: 'Flöde', icon: BookOpen },
    { value: 'assets', label: 'Material', icon: FileText },
    { value: 'recordings', label: 'Inspelningar', icon: Video },
];
