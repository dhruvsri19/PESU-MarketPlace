import { supabase } from './supabase';

const BUCKET = 'avatars';

/**
 * Delete all existing avatar files for a user.
 */
export async function deleteOldAvatar(userId: string): Promise<void> {
    const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(userId, { limit: 100 });

    if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from(BUCKET).remove(paths);
    }
}

/**
 * Upload a new avatar image and update the profile.
 * Returns the public URL of the uploaded avatar.
 */
export async function uploadAvatar(
    userId: string,
    file: File
): Promise<string> {
    // 1. Delete old avatar first
    await deleteOldAvatar(userId);

    // 2. Determine file extension and upload path
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filePath = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type,
        });

    if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 3. Get public URL with cache-busting timestamp
    const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // 4. Update profile record
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

    if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
    }

    return publicUrl;
}

/**
 * Remove the user's avatar entirely.
 * Deletes file(s) from storage and sets avatar_url to NULL in the DB.
 */
export async function deleteAvatar(userId: string): Promise<void> {
    // 1. Delete all files in the user's avatar folder
    await deleteOldAvatar(userId);

    // 2. Set avatar_url to null in profiles
    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

    if (error) {
        throw new Error(`Failed to clear avatar URL: ${error.message}`);
    }
}
