import { useOutletContext } from 'react-router-dom';
import type { WorkspaceContext } from '../AssociationWorkspace';

export default function WorkspaceTasks() {
    useOutletContext<WorkspaceContext>();

    return (
        <div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-2">
                Uppgifter
            </h2>
            <p className="text-surface-600 dark:text-surface-300">Byggs i nästa steg.</p>
        </div>
    );
}
