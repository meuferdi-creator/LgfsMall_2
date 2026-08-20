/**
 * Image optimization helper to compress image size and format on the fly.
 * Reduces bandwidth usage drastically for mobile and desktop loading.
 */
export const getOptimizedImageUrl = (url: string | undefined | null, width = 600, quality = 75): string => {
  if (!url) {
    return `https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  // If it's an Unsplash image, inject width, quality, auto=format
  if (url.includes("images.unsplash.com")) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set("auto", "format");
      parsedUrl.searchParams.set("fit", "crop");
      parsedUrl.searchParams.set("w", width.toString());
      parsedUrl.searchParams.set("q", quality.toString());
      return parsedUrl.toString();
    } catch (e) {
      return url;
    }
  }

  return url;
};
