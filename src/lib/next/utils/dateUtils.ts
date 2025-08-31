/**
 * Date formatting utilities with automatic locale support
 * 
 * Uses navigator.languages to respect user's preferred language settings
 * and falls back gracefully if not available.
 */

export type DateFormatType = 'date' | 'dateTime' | 'timeAgo';

export interface TimeFormatOptions {
    compact?: boolean;
}

/**
 * Format a timestamp with automatic locale detection
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param format - Format type ('date', 'dateTime', or 'timeAgo')
 * @param options - Additional formatting options
 * @returns Formatted date string in user's preferred locale
 * 
 * @example
 * formatTime(1672531200000)                                    // "Dec 31, 2022, 10:00 PM" (default dateTime)
 * formatTime(1672531200000, 'date')                           // "Dec 31, 2022"
 * formatTime(Date.now() - 7200000, 'timeAgo')                 // "2 hours ago"
 * formatTime(Date.now() - 7200000, 'timeAgo', { compact: true }) // "2h ago"
 */
export function formatTime(
    timestamp: number, 
    format: DateFormatType = 'dateTime',
    options: TimeFormatOptions = {}
): string {
    const date = new Date(timestamp);
    
    // Get user's preferred languages, with fallback to en-US
    const locales = typeof navigator !== 'undefined' && navigator.languages 
        ? navigator.languages 
        : ['en-US'];
    
    switch (format) {
        case 'date':
            return date.toLocaleDateString(locales, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
        case 'timeAgo':
            const now = Date.now();
            const diff = now - timestamp;
            
            // Handle future dates
            if (diff < 0) {
                return formatTime(timestamp, 'date');
            }
            
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (minutes < 1) return 'Just now';
            
            if (options.compact) {
                // Compact format matching InlineImageSelector
                if (minutes < 60) return `${minutes}m ago`;
                if (hours < 24) return `${hours}h ago`;
                
                // For same day but older than 24h, show time (like InlineImageSelector)
                const nowDate = new Date(now);
                const isToday = date.toDateString() === nowDate.toDateString();
                if (isToday) {
                    return date.toLocaleTimeString(locales, { hour: '2-digit', minute: '2-digit' });
                } else {
                    return date.toLocaleDateString(locales, { month: 'short', day: 'numeric' });
                }
            } else {
                // Verbose format
                if (minutes === 1) return '1 minute ago';
                if (minutes < 60) return `${minutes} minutes ago`;
                if (hours === 1) return '1 hour ago';
                if (hours < 24) return `${hours} hours ago`;
                if (days === 1) return '1 day ago';
                if (days < 7) return `${days} days ago`;
                
                // For older items, fallback to formatted date
                return formatTime(timestamp, 'date');
            }
            
        case 'dateTime':
        default:
            return date.toLocaleString(locales, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    }
}

/**
 * Format a date for display in lists or summaries
 * Convenience wrapper for formatTime(timestamp, 'date')
 */
export function formatDate(timestamp: number): string {
    return formatTime(timestamp, 'date');
}

/**
 * Format a date and time for detailed display
 * Convenience wrapper for formatTime(timestamp, 'dateTime')
 */
export function formatDateTime(timestamp: number): string {
    return formatTime(timestamp, 'dateTime');
}

/**
 * Format a relative time (e.g. "2h ago", "Just now")
 * Convenience wrapper for formatTime(timestamp, 'timeAgo')
 */
export function formatTimeAgo(timestamp: number): string {
    return formatTime(timestamp, 'timeAgo');
}

/**
 * Format a compact relative time (e.g. "2h ago", "3m ago")
 * Convenience wrapper for formatTime(timestamp, 'timeAgo', { compact: true })
 */
export function formatTimeAgoCompact(timestamp: number): string {
    return formatTime(timestamp, 'timeAgo', { compact: true });
}
