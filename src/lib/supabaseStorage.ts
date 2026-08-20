import { supabase, isSupabaseConfigured } from "./supabaseClient";

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param bucket - Bucket name (e.g., 'products', 'kyc-documents', 'avatars')
 * @param path - Target file path within the bucket (e.g., 'products/123/image.jpg')
 * @param file - File object or Blob to upload
 * @returns Public URL of the uploaded file or null on error
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  path: string,
  file: File | Blob
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { url: null, error: "Supabase client is not configured." };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading file to Supabase bucket '${bucket}':`, error.message);
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error("Unexpected error during Supabase storage upload:", err);
    return { url: null, error: err?.message || "Erreur lors du téléchargement du fichier." };
  }
}

/**
 * Helper to convert Base64 Data URL to a File object for Supabase Storage upload
 */
export function base64ToFile(base64Data: string, filename: string): File {
  const arr = base64Data.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1] || "");
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFromSupabaseStorage(
  bucket: string,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase configuration missing." };
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur de suppression." };
  }
}
