import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notifications';

// Default notification sounds
const NOTIFICATION_SOUNDS = {
    default: '/sounds/notification-default.mp3',
    chime: '/sounds/notification-chime.mp3',
    bell: '/sounds/notification-bell.mp3',
    ding: '/sounds/notification-ding.mp3',
    ping: '/sounds/notification-ping.mp3',
    pop: '/sounds/notification-pop.mp3'
};

/**
 * useNotificationSound Hook
 * Manages notification sound playback based on user preferences
 */
export const useNotificationSound = () => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef(null);
    const lastPlayedRef = useRef(0);

    // Fetch notification preferences
    const fetchPreferences = useCallback(async () => {
        try {
            const response = await getNotificationPreferences();

            if (response.status === 'success') {
                setPreferences(response.preferences);
            }
        } catch (err) {
            console.error('Error fetching notification preferences:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize audio element
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }
    }, []);

    // Fetch preferences on mount
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    // Update audio source when preferences change
    useEffect(() => {
        if (preferences && audioRef.current) {
            const soundType = preferences.sound_type || 'default';

            if (soundType === 'custom' && preferences.custom_sound_url) {
                audioRef.current.src = preferences.custom_sound_url;
            } else {
                audioRef.current.src = NOTIFICATION_SOUNDS[soundType] || NOTIFICATION_SOUNDS.default;
            }
        }
    }, [preferences]);

    // Play notification sound
    const playSound = useCallback(() => {
        // Check if sound is enabled
        if (!preferences || !preferences.sound_enabled || !audioRef.current) {
            return;
        }

        // Prevent playing sound too frequently (throttle to once per second)
        const now = Date.now();
        if (now - lastPlayedRef.current < 1000) {
            return;
        }

        // Play the sound
        audioRef.current.play().catch(err => {
            console.error('Error playing notification sound:', err);
        });

        lastPlayedRef.current = now;
    }, [preferences]);

    // Update preferences
    const updatePreferences = useCallback(async (updates) => {
        try {
            const response = await updateNotificationPreferences(updates);

            if (response.status === 'success') {
                setPreferences(response.preferences);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error updating notification preferences:', err);
            return false;
        }
    }, []);

    return {
        preferences,
        loading,
        playSound,
        updatePreferences,
        refreshPreferences: fetchPreferences
    };
};

/**
 * useNotificationPreferences Hook
 * Manages all notification preferences (including non-sound settings)
 */
export const useNotificationPreferences = () => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Fetch preferences
    const fetchPreferences = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getNotificationPreferences();

            if (response.status === 'success') {
                setPreferences(response.preferences);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching notification preferences:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Update preferences
    const updatePreferences = useCallback(async (updates) => {
        try {
            setSaving(true);
            const response = await updateNotificationPreferences(updates);

            if (response.status === 'success') {
                setPreferences(response.preferences);
                setError(null);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error updating notification preferences:', err);
            setError(err.message);
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    return {
        preferences,
        loading,
        saving,
        error,
        updatePreferences,
        refreshPreferences: fetchPreferences
    };
};
