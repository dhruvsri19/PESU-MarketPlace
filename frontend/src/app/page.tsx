import MainDashboard from '@/components/MainDashboard';
import { RootAuthManager } from '@/components/RootAuthManager';

export const dynamic = 'force-dynamic';

export default function RootPage() {
    return (
        <RootAuthManager>
            <MainDashboard />
        </RootAuthManager>
    );
}
