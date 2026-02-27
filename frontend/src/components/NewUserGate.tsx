'use client';

import { useAuth } from '@/context/AuthContext';
import { EditProfileModal } from '@/components/EditProfileModal';

/**
 * Global gate: renders the EditProfileModal forced-open on top of whatever
 * page the user is on when isNewUser is true (no profile row or empty full_name).
 *
 * Placed in layout.tsx so it fires on ANY page immediately after login.
 */
export function NewUserGate() {
    const { user, profile, isNewUser, setIsNewUser, refreshProfile } = useAuth();

    if (!isNewUser || !user) return null;

    const handleClose = () => {
        // No-op when isFirstTime — modal hides the X button anyway
    };

    const handleUpdate = async () => {
        await refreshProfile();
        // refreshProfile re-fetches profile, which will set isNewUser = false if full_name is filled
    };

    return (
        <EditProfileModal
            user={user}
            profile={profile || { id: user.id, email: user.email }}
            isFirstTime={true}
            onClose={handleClose}
            onUpdate={handleUpdate}
        />
    );
}
