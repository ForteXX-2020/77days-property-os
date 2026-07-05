"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeDealMetrics,
  parseDealNumberInput
} from "@/lib/dealMetrics";
import { SOURCE_FILE_DOCUMENT_TYPE_OPTIONS } from "@/lib/dealConstants";
import {
  getSourceFileParserKind,
  getSourceFileUnsupportedReason,
  parseSourceFileBytes
} from "@/lib/sourceFileParser";
import { SOURCE_FILES_BUCKET } from "@/lib/sourceFiles";
import { normalizeSourceFileStoragePath } from "@/lib/sourceFiles";
import { createSupabaseClient } from "@/lib/supabaseClient";
import type { DealInsert, SourceFileInsert } from "@/types/supabase";

export type CreateDealActionState = {
  status: "idle" | "error";
  message: string;
  warnings: string[];
};

export type UploadDealSourceFileActionState = {
  status: "idle" | "error";
  message: string;
};

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} is required.`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function getMetricInput(formData: FormData) {
  const fields = [
    { key: "asking_price", label: "Asking price" },
    { key: "monthly_rent_full", label: "Monthly rent full" },
    { key: "annual_rent_full", label: "Annual rent full" },
    { key: "monthly_rent_current", label: "Monthly rent current" },
    { key: "annual_rent_current", label: "Annual rent current" },
    { key: "gross_yield_full", label: "満室想定利回り" },
    { key: "current_yield", label: "現況利回り" }
  ] as const;

  const errors: string[] = [];
  const values = {
    asking_price: null as number | null,
    monthly_rent_full: null as number | null,
    annual_rent_full: null as number | null,
    monthly_rent_current: null as number | null,
    annual_rent_current: null as number | null,
    gross_yield_full: null as number | null,
    current_yield: null as number | null
  };

  for (const field of fields) {
    const parsed = parseDealNumberInput(formData.get(field.key), field.label);

    if (parsed.error) {
      errors.push(parsed.error);
    }

    values[field.key] = parsed.value;
  }

  return {
    values,
    errors
  };
}

function safeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const fallback = "source-file";
  const lastDotIndex = trimmed.lastIndexOf(".");
  const baseName =
    lastDotIndex > 0 ? trimmed.slice(0, lastDotIndex) : trimmed || fallback;
  const extension = lastDotIndex > 0 ? trimmed.slice(lastDotIndex) : "";
  const safeBaseName =
    baseName
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback;
  const safeExtension = extension
    .replace(/[^a-zA-Z0-9.]/g, "")
    .slice(0, 16);

  return `${safeBaseName}${safeExtension}`;
}

function getDocumentType(formData: FormData) {
  const value = getOptionalString(formData, "document_type");

  if (
    value &&
    SOURCE_FILE_DOCUMENT_TYPE_OPTIONS.includes(
      value as (typeof SOURCE_FILE_DOCUMENT_TYPE_OPTIONS)[number]
    )
  ) {
    return value;
  }

  throw new Error("document_type is required.");
}

function getRequiredFile(formData: FormData) {
  const value = formData.get("file");

  if (!(value instanceof File) || value.size === 0) {
    throw new Error("File is required.");
  }

  return value;
}

function getOriginalFileName(formData: FormData, file: File) {
  const value = formData.get("original_file_name");
  const fileName =
    typeof value === "string" && value.trim() !== "" ? value : file.name;

  return fileName.normalize("NFC");
}

export async function createDeal(
  _previousState: CreateDealActionState,
  formData: FormData
): Promise<CreateDealActionState> {
  let dealName: string;

  try {
    dealName = getRequiredString(formData, "deal_name");
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Deal name is required.",
      warnings: []
    };
  }

  const metricInput = getMetricInput(formData);
  const normalizedMetrics = normalizeDealMetrics(metricInput.values);
  const errors = [...metricInput.errors, ...normalizedMetrics.errors];

  if (errors.length > 0) {
    return {
      status: "error",
      message: errors.join(" "),
      warnings: normalizedMetrics.warnings
    };
  }

  const payload: DealInsert = {
    deal_name: dealName,
    property_name: getOptionalString(formData, "property_name"),
    address: getOptionalString(formData, "address"),
    asking_price: normalizedMetrics.values.asking_price,
    monthly_rent_full: normalizedMetrics.values.monthly_rent_full,
    annual_rent_full: normalizedMetrics.values.annual_rent_full,
    monthly_rent_current: normalizedMetrics.values.monthly_rent_current,
    annual_rent_current: normalizedMetrics.values.annual_rent_current,
    gross_yield: normalizedMetrics.values.gross_yield_full,
    gross_yield_full: normalizedMetrics.values.gross_yield_full,
    current_yield: normalizedMetrics.values.current_yield,
    calculated_gross_yield_full:
      normalizedMetrics.values.calculated_gross_yield_full,
    calculated_current_yield: normalizedMetrics.values.calculated_current_yield,
    property_type: getOptionalString(formData, "property_type"),
    status: getOptionalString(formData, "status") ?? "sourced",
    final_decision: getOptionalString(formData, "final_decision") ?? "undecided",
    memo: getOptionalString(formData, "memo"),
    next_action: getOptionalString(formData, "next_action")
  };

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("deals")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: `Failed to create deal: ${error.message}`,
      warnings: normalizedMetrics.warnings
    };
  }

  redirect(`/deals/${data.id}`);
}

export async function softDeleteDeal(dealId: string) {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("deals")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_reason: null
    })
    .eq("id", dealId);

  if (error) {
    throw new Error(`Failed to delete deal: ${error.message}`);
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  redirect("/deals");
}

export async function restoreDeal(dealId: string) {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("deals")
    .update({
      deleted_at: null,
      deleted_reason: null,
      restored_at: new Date().toISOString()
    })
    .eq("id", dealId);

  if (error) {
    throw new Error(`Failed to restore deal: ${error.message}`);
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
}

export async function uploadDealSourceFile(
  dealId: string,
  _previousState: UploadDealSourceFileActionState,
  formData: FormData
): Promise<UploadDealSourceFileActionState> {
  const supabase = createSupabaseClient();
  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) {
    return {
      status: "error",
      message: `Failed to validate deal: ${dealError.message}`
    };
  }

  if (!deal) {
    return {
      status: "error",
      message: "Deal was not found."
    };
  }

  let file: File;
  let documentType: string;

  try {
    file = getRequiredFile(formData);
    documentType = getDocumentType(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Invalid upload form."
    };
  }

  const notes = getOptionalString(formData, "notes");
  const originalFileName = getOriginalFileName(formData, file);
  const safeStorageFileName = safeFileName(originalFileName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const storagePath = `deals/${dealId}/${timestamp}-${safeStorageFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(SOURCE_FILES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false
    });

  if (uploadError) {
    console.error("Source file upload failed", {
      bucket: SOURCE_FILES_BUCKET,
      originalFileName,
      safeStorageFileName,
      storagePath,
      error: uploadError.message
    });

    return {
      status: "error",
      message: `Failed to upload file: ${uploadError.message}`
    };
  }

  if (uploadData?.path && uploadData.path !== storagePath) {
    console.warn("Source file upload path mismatch", {
      bucket: SOURCE_FILES_BUCKET,
      expectedStoragePath: storagePath,
      uploadedPath: uploadData.path
    });
  }

  const payload: SourceFileInsert = {
    deal_id: dealId,
    property_id: null,
    file_name: originalFileName,
    file_type: file.type || null,
    document_type: documentType,
    storage_path: storagePath,
    processing_status: "uploaded",
    review_status: "unchecked",
    extracted_text: null,
    extracted_json: null,
    page_count: null,
    estimated_cost: null,
    processed_at: null,
    notes
  };

  const { data: insertedSourceFile, error: insertError } = await supabase
    .from("source_files")
    .insert(payload)
    .select("id, file_name, storage_path")
    .single();

  if (insertError) {
    await supabase.storage.from(SOURCE_FILES_BUCKET).remove([storagePath]);

    console.error("Source file metadata insert failed", {
      bucket: SOURCE_FILES_BUCKET,
      originalFileName,
      safeStorageFileName,
      storagePath,
      error: insertError.message
    });

    return {
      status: "error",
      message: `File uploaded, but metadata insert failed: ${insertError.message}`
    };
  }

  if (insertedSourceFile?.storage_path !== storagePath) {
    console.warn("Source file metadata storage path mismatch", {
      sourceFileId: insertedSourceFile?.id,
      expectedStoragePath: storagePath,
      insertedStoragePath: insertedSourceFile?.storage_path
    });
  }

  revalidatePath(`/deals/${dealId}`);
  redirect(`/deals/${dealId}`);
}

export async function processDealSourceFile(dealId: string, sourceFileId: string) {
  const supabase = createSupabaseClient();
  const { data: sourceFile, error: sourceFileError } = await supabase
    .from("source_files")
    .select("*")
    .eq("id", sourceFileId)
    .eq("deal_id", dealId)
    .maybeSingle();

  if (sourceFileError) {
    throw new Error(`Failed to load source file: ${sourceFileError.message}`);
  }

  if (!sourceFile) {
    throw new Error("Source file was not found.");
  }

  const parserKind = getSourceFileParserKind(sourceFile);

  if (!parserKind) {
    throw new Error(getSourceFileUnsupportedReason(sourceFile));
  }

  const objectKey = normalizeSourceFileStoragePath(sourceFile.storage_path);
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(SOURCE_FILES_BUCKET)
    .download(objectKey);

  if (downloadError || !fileBlob) {
    await markSourceFileParsingFailed(
      sourceFile.id,
      `Storage download failed: ${downloadError?.message ?? "No file returned."}`
    );
    throw new Error(
      `Failed to download source file: ${downloadError?.message ?? "No file returned."}`
    );
  }

  try {
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());
    const parsed = parseSourceFileBytes(sourceFile, bytes);
    const { error: updateError } = await supabase
      .from("source_files")
      .update({
        extracted_text: parsed.extractedText,
        extracted_json: parsed.extractedJson,
        page_count: parsed.pageCount ?? sourceFile.page_count ?? null,
        estimated_cost: 0,
        processing_status: "parsed",
        processed_at: new Date().toISOString()
      })
      .eq("id", sourceFile.id);

    if (updateError) {
      throw new Error(`Failed to save parser output: ${updateError.message}`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Parser failed with an unknown error.";
    await markSourceFileParsingFailed(sourceFile.id, message);
    throw error;
  }

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/deals/${dealId}/sources`);
  revalidatePath(`/deals/${dealId}/source-files`);
  revalidatePath(`/deals/${dealId}/sources/${sourceFileId}`);
}

async function markSourceFileParsingFailed(sourceFileId: string, message: string) {
  const supabase = createSupabaseClient();
  const timestamp = new Date().toISOString();
  const { data: sourceFile } = await supabase
    .from("source_files")
    .select("notes")
    .eq("id", sourceFileId)
    .maybeSingle();
  const notes = [sourceFile?.notes, `[parser ${timestamp}] ${message}`]
    .filter(Boolean)
    .join("\n");

  await supabase
    .from("source_files")
    .update({
      processing_status: "failed",
      processed_at: timestamp,
      estimated_cost: 0,
      notes
    })
    .eq("id", sourceFileId);
}
