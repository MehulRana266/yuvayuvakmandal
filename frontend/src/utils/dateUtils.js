/**
 * Formats a review timestamp or date into accurate Indian Standard Time (IST - Asia/Kolkata)
 * matching the chosen language locale.
 */
export function formatReviewDate(item, lang = 'EN') {
  if (!item) return '';

  let dateObj = null;

  // 1. Check createdAt (ISO timestamp from MongoDB/backend)
  if (item.createdAt) {
    const d = new Date(item.createdAt);
    if (!isNaN(d.getTime())) {
      dateObj = d;
    }
  }

  // 2. Check item.id if it is a millisecond timestamp
  if (!dateObj && item.id) {
    const num = Number(item.id);
    if (!isNaN(num) && num > 1577836800000 && num < 2208988800000) {
      const d = new Date(num);
      if (!isNaN(d.getTime())) {
        dateObj = d;
      }
    }
  }

  // 3. Format into Indian Standard Time (Asia/Kolkata)
  if (dateObj) {
    try {
      const locale = lang === 'HI' ? 'hi-IN' : lang === 'GU' ? 'gu-IN' : 'en-GB';
      const datePart = dateObj.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
      const timePart = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
      return `${datePart}, ${timePart}`;
    } catch (e) {
      return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
             dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  }

  // 4. Fallback to existing date string
  return item.date || 'Recent';
}
