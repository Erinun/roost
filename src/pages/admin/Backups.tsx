import { useState, useEffect, useCallback } from 'react';
import { backupService, BackupInfo, BackupResult } from '@/services/backup';
import {
    RefreshCw,
    Database,
    HardDrive,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    FileArchive,
    Download,
} from 'lucide-react';

export default function AdminBackups() {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [backupResult, setBackupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastBackupDetails, setLastBackupDetails] = useState<BackupResult | null>(null);

    const fetchBackups = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await backupService.listBackups();
            setBackups(data.backups);
        } catch (error) {
            console.error('Error fetching backups:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleTriggerBackup = async () => {
        try {
            setIsBackingUp(true);
            setBackupResult(null);
            setLastBackupDetails(null);

            const result = await backupService.triggerBackup();

            if (result.success) {
                setBackupResult({
                    type: 'success',
                    message: `Säkerhetskopieringen slutfördes på ${result.duration?.toFixed(1)} s`,
                });
                setLastBackupDetails(result);
                await fetchBackups();
            } else {
                setBackupResult({
                    type: 'error',
                    message: result.error || 'Säkerhetskopieringen misslyckades',
                });
            }
        } catch (error) {
            setBackupResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Det gick inte att starta säkerhetskopieringen',
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('sv-SE', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} minuter sedan`;
        if (diffHours < 24) return `${diffHours} timmar sedan`;
        return `${diffDays} dagar sedan`;
    };

    const handleDownload = async (filename: string) => {
        try {
            setDownloadingFile(filename);
            await backupService.downloadBackup(filename);
        } catch (error) {
            console.error('Download error:', error);
            setBackupResult({
                type: 'error',
                message: error instanceof Error ? error.message : 'Det gick inte att ladda ner säkerhetskopian',
            });
        } finally {
            setDownloadingFile(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const latestBackup = backups[0];
    const totalSize = backups.reduce((sum, b) => sum + parseFloat(b.sizeMB), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Säkerhetskopior av databasen</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Hantera säkerhetskopior av databasen som lagras i S3
                    </p>
                </div>
                <button
                    onClick={fetchBackups}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg text-surface-700 dark:text-surface-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Uppdatera
                </button>
            </div>

            {/* Backup Result Message */}
            {backupResult && (
                <div
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                        backupResult.type === 'success'
                            ? 'bg-success/10 dark:bg-success/15 text-surface-900 dark:text-surface-50 border border-success/40'
                            : 'bg-error/10 dark:bg-error/20 text-surface-900 dark:text-error-soft border border-error/60'
                    }`}
                >
                    {backupResult.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-surface-900 dark:text-success flex-shrink-0" />
                    ) : (
                        <XCircle className="w-5 h-5 text-error-strong dark:text-error-soft flex-shrink-0" />
                    )}
                    <div>
                        <p className="font-medium">{backupResult.message}</p>
                        {lastBackupDetails && (
                            <p className="text-sm mt-1 opacity-80">
                                Fil: {lastBackupDetails.filename} ({((lastBackupDetails.size || 0) / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                            <Database className="w-6 h-6 text-primary-600 dark:text-primary-300" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{backups.length}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Totalt antal säkerhetskopior</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-success/15 dark:bg-success/20 rounded-lg">
                            <HardDrive className="w-6 h-6 text-surface-900 dark:text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                                {totalSize.toFixed(1)} MB
                            </p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Totalt lagringsutrymme</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-warning/20 dark:bg-warning/20 rounded-lg">
                            <Clock className="w-6 h-6 text-surface-900 dark:text-warning" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                                {latestBackup ? getTimeSince(latestBackup.createdAt) : 'Aldrig'}
                            </p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Senaste säkerhetskopia</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trigger Backup */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Skapa säkerhetskopia</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                        onClick={handleTriggerBackup}
                        disabled={isBackingUp}
                        className="flex min-w-[300px] items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 transition-colors font-medium"
                    >
                        {isBackingUp ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Skapar säkerhetskopia...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                Skapa säkerhetskopia nu
                            </>
                        )}
                    </button>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        Skapar en komprimerad SQL-dump av databasen och laddar upp den till S3.
                        Detta kan ta några minuter beroende på databasens storlek.
                    </p>
                </div>

                {/* Auto-backup info */}
                <div className="mt-4 p-4 bg-info/10 dark:bg-info/15 rounded-lg border border-info/40">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-surface-900 dark:text-surface-50">
                            <p className="font-medium">Automatiska säkerhetskopior</p>
                            <p className="mt-1 opacity-80">
                                Säkerhetskopior skapas automatiskt före varje driftsättning. Systemet behåller de 30 senaste säkerhetskopiorna.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup List */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Historik för säkerhetskopior</h2>

                {backups.length === 0 ? (
                    <div className="text-center py-12">
                        <FileArchive className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                        <p className="text-surface-500 dark:text-surface-400">Inga säkerhetskopior hittades</p>
                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
                            Skapa din första säkerhetskopia med knappen ovan
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        Filnamn
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        Storlek
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        Skapad
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        Ålder
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        Åtgärder
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map((backup, index) => (
                                    <tr
                                        key={backup.filename}
                                        className={`border-b border-surface-100 dark:border-surface-800 ${
                                            index === 0 ? 'bg-success/5 dark:bg-success/10' : ''
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FileArchive className="w-4 h-4 text-surface-400" />
                                                <code className="text-sm text-surface-700 dark:text-surface-300 font-mono">
                                                    {backup.filename}
                                                </code>
                                                {index === 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/15 text-surface-900 dark:bg-success/20 dark:text-success">
                                                        Senaste
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-600 dark:text-surface-400">
                                                {backup.sizeMB} MB
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-600 dark:text-surface-400">
                                                {formatDate(backup.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-500 dark:text-surface-500">
                                                {getTimeSince(backup.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDownload(backup.filename)}
                                                disabled={downloadingFile === backup.filename}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors disabled:opacity-50"
                                                title="Ladda ner säkerhetskopia"
                                            >
                                                {downloadingFile === backup.filename ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Ladda ner
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
