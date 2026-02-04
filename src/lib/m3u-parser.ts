
type Tvg = {
  id: string;
  name: string;
  logo: string;
};

type Group = {
  title: string;
};

type Http = {
  "content-type"?: string;
};

export type Channel = {
  tvg: Tvg;
  group: Group;
  http: Http;
  name: string;
  url: string;
};

/**
 * Sanitizes a string to be used as a safe Firestore document ID.
 * Replaces slashes, spaces, and other special characters that might break Firestore paths.
 */
const sanitizeId = (id: string): string => {
  if (!id) return '';
  // Replace forward slashes, backslashes, dots, and hash/question marks which are problematic in Firestore paths or URLs
  return id.replace(/[\/\s\?#\.\\\:]/g, '_');
};

/**
 * Enhanced manual M3U/M3U8 parser.
 * Handles standard IPTV playlist formats and is robust against missing tags.
 */
export const manualParse = (m3u: string): { items: Channel[] } => {
  const lines = m3u.split('\n');
  const items: Channel[] = [];
  let currentItem: Partial<Channel> = { 
    tvg: { id: '', name: '', logo: '' }, 
    group: { title: '' }, 
    http: {} 
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#EXTM3U')) continue;

    if (trimmedLine.startsWith('#EXTINF:')) {
      const info = trimmedLine.substring(8).trim();
      
      // Extract attributes using regex with case-insensitive flags
      const tvgIdMatch = info.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = info.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = info.match(/tvg-logo="([^"]*)"/i);
      const groupTitleMatch = info.match(/group-title="([^"]*)"/i);
      
      // The name is usually the last part of the line after the last comma
      const nameParts = info.split(',');
      const name = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : '';

      const rawId = tvgIdMatch ? tvgIdMatch[1] : (tvgNameMatch ? tvgNameMatch[1] : '');

      currentItem.tvg = {
        id: sanitizeId(rawId),
        name: tvgNameMatch ? tvgNameMatch[1] : '',
        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
      };
      
      currentItem.group = {
        title: groupTitleMatch ? groupTitleMatch[1] : '',
      };
      
      currentItem.name = name || 'Unknown Channel';

    } else if (trimmedLine.startsWith('#EXTGRP:')) {
      // Handle alternative group tag
      if (currentItem.group) {
        currentItem.group.title = trimmedLine.substring(8).trim();
      }
    } else if (trimmedLine.startsWith('http')) {
      // This is the URL line
      currentItem.url = trimmedLine;
      
      // Ensure we have at least a fallback ID (use sanitized URL)
      if (currentItem.tvg && !currentItem.tvg.id) {
        currentItem.tvg.id = sanitizeId(currentItem.url);
      }

      // Final validation: only push if we have a URL
      if (currentItem.url) {
        items.push(currentItem as Channel);
      }

      // Reset for next item
      currentItem = { 
        tvg: { id: '', name: '', logo: '' }, 
        group: { title: '' }, 
        http: {} 
      };
    }
  }
  return { items };
};
