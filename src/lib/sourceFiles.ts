import { SOURCE_FILE_DOCUMENT_TYPE_LABELS } from "@/lib/dealConstants";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { SourceFileDocumentType } from "@/lib/dealConstants";
import type { SourceFileRow } from "@/types/supabase";

export const SOURCE_FILES_BUCKET = "source-files";
export const SOURCE_FILE_SIGNED_URL_EXPIRES_IN_SECONDS = 300;

export function formatSourceFileDocumentType(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return (
    SOURCE_FILE_DOCUMENT_TYPE_LABELS[value as SourceFileDocumentType] ?? value
  );
}

export function supportsSourceFilePreview(fileType: string | null | undefined) {
  if (!fileType) {
    return false;
  }

  return fileType === "application/pdf" || fileType.startsWith("image/");
}

export function normalizeSourceFileStoragePath(storagePath: string) {
  const trimmed = storagePath.trim();

  try {
    const url = new URL(trimmed);
    const marker = `/object/${SOURCE_FILES_BUCKET}/`;
    const signedMarker = `/object/sign/${SOURCE_FILES_BUCKET}/`;
    const objectIndex = url.pathname.indexOf(marker);
    const signedIndex = url.pathname.indexOf(signedMarker);

    if (objectIndex >= 0) {
      return decodeURIComponent(
        url.pathname.slice(objectIndex + marker.length)
      );
    }

    if (signedIndex >= 0) {
      return decodeURIComponent(
        url.pathname.slice(signedIndex + signedMarker.length)
      );
    }
  } catch {
    // Not a URL. Continue with plain object-key normalization.
  }

  return trimmed
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${SOURCE_FILES_BUCKET}/`), "");
}

export async function getDealSourceFile(
  dealId: string,
  sourceFileId: string
): Promise<SourceFileRow | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("source_files")
    .select("*")
    .eq("id", sourceFileId)
    .eq("deal_id", dealId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load source file: ${error.message}`);
  }

  return data;
}

export async function createSourceFileSignedUrl(sourceFile: SourceFileRow) {
  const supabase = createSupabaseClient();
  const objectKey = normalizeSourceFileStoragePath(sourceFile.storage_path);
  const { data, error } = await supabase.storage
    .from(SOURCE_FILES_BUCKET)
    .createSignedUrl(
      objectKey,
      SOURCE_FILE_SIGNED_URL_EXPIRES_IN_SECONDS
    );

  if (error) {
    console.error("Source file signed URL creation failed", {
      sourceFileId: sourceFile.id,
      bucket: SOURCE_FILES_BUCKET,
      storedStoragePath: sourceFile.storage_path,
      createSignedUrlPath: objectKey,
      error: error.message
    });

    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
