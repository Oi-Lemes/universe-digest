import { buildGoogleDriveUrl, DriveReference } from "@/lib/google-drive-link";

export const IMPERIO_DRIVE_ROOT_REFERENCE: DriveReference = {
  driveType: "folder",
  driveId: "11SVA323KWtChNn9SdhfqhhkewLlsy683",
};

export const IMPERIO_DRIVE_ROOT_URL = buildGoogleDriveUrl(
  IMPERIO_DRIVE_ROOT_REFERENCE.driveType,
  IMPERIO_DRIVE_ROOT_REFERENCE.driveId
);

const DRIVE_FIELD_NAMES = [
  "driveLink",
  "googleDriveUrl",
  "folderUrl",
  "shareUrl",
  "attachmentUrl",
  "driveId",
  "driveType",
  "drive_id",
  "drive_type",
  "google_drive_url",
  "folder_url",
  "share_url",
  "attachment_url",
  "link",
  "url",
] as const;

export function driveDebugFields(source: unknown): Record<string, unknown> {
  const item = (source ?? {}) as Record<string, unknown>;
  return Object.fromEntries(DRIVE_FIELD_NAMES.map((field) => [field, item[field]]));
}

export function canonicalizeDriveTreeRoot<T extends { id: string; name: string }>(tree: T): T {
  if (tree.id === IMPERIO_DRIVE_ROOT_REFERENCE.driveId) return tree;
  console.warn("[drive-debug] raiz local do acervo estava com ID legado; normalizando em memória", {
    previousRootId: tree.id,
    previousRootName: tree.name,
    canonicalDriveType: IMPERIO_DRIVE_ROOT_REFERENCE.driveType,
    canonicalDriveId: IMPERIO_DRIVE_ROOT_REFERENCE.driveId,
    canonicalUrl: IMPERIO_DRIVE_ROOT_URL,
  });
  return { ...tree, id: IMPERIO_DRIVE_ROOT_REFERENCE.driveId };
}
