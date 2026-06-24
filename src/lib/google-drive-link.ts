export type DriveType = "file" | "folder";

export type DriveReference = {
  driveType: DriveType;
  driveId: string;
  originalDriveUrl?: string;
};

export type ParsedDriveLink = {
  driveType: DriveType;
  driveId: string;
  originalUrl: string;
};

const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;
const SUPPORTED_GOOGLE_HOST_RE = /(^|\.)(drive|docs)\.google\.com$/;

function assertDriveId(id: string | null | undefined): string {
  const cleaned = (id ?? "").trim();
  if (!DRIVE_ID_RE.test(cleaned)) {
    throw new Error("Não consegui identificar o ID desse link do Google Drive.");
  }
  return cleaned;
}

function parseDocsGooglePath(pathParts: string[]): ParsedDriveLink | null {
  // Docs/Sheets/Slides/Forms links follow: /document/d/{id}/..., /spreadsheets/d/{id}/...
  const dIndex = pathParts.indexOf("d");
  if (dIndex >= 0 && pathParts[dIndex + 1]) {
    return {
      driveType: "file",
      driveId: assertDriveId(pathParts[dIndex + 1]),
      originalUrl: "",
    };
  }
  return null;
}

export function parseGoogleDriveLink(rawUrl: string): ParsedDriveLink {
  const originalUrl = (rawUrl ?? "").trim();
  if (!originalUrl) {
    throw new Error("Informe um link do Google Drive.");
  }

  let parsed: URL;
  try {
    parsed = new URL(originalUrl);
  } catch {
    throw new Error("Esse link do Google Drive é inválido.");
  }

  if (parsed.protocol !== "https:" || !SUPPORTED_GOOGLE_HOST_RE.test(parsed.hostname)) {
    throw new Error("Use um link válido do Google Drive ou Google Docs.");
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);
  let result: ParsedDriveLink | null = null;

  if (parsed.hostname === "drive.google.com" || parsed.hostname.endsWith(".drive.google.com")) {
    const foldersIndex = pathParts.indexOf("folders");
    if (pathParts[0] === "drive" && foldersIndex >= 0 && pathParts[foldersIndex + 1]) {
      result = {
        driveType: "folder",
        driveId: assertDriveId(pathParts[foldersIndex + 1]),
        originalUrl,
      };
    }

    const fileIndex = pathParts.indexOf("file");
    const dIndex = pathParts.indexOf("d");
    if (!result && fileIndex >= 0 && dIndex > fileIndex && pathParts[dIndex + 1]) {
      result = {
        driveType: "file",
        driveId: assertDriveId(pathParts[dIndex + 1]),
        originalUrl,
      };
    }

    const idParam = parsed.searchParams.get("id");
    if (!result && (pathParts[0] === "open" || pathParts[0] === "uc") && idParam) {
      result = {
        driveType: "file",
        driveId: assertDriveId(idParam),
        originalUrl,
      };
    }
  }

  if (!result && (parsed.hostname === "docs.google.com" || parsed.hostname.endsWith(".docs.google.com"))) {
    const docsResult = parseDocsGooglePath(pathParts);
    if (docsResult) result = { ...docsResult, originalUrl };
  }

  if (!result) {
    throw new Error("Formato de link do Google Drive não suportado.");
  }

  return result;
}

export function buildGoogleDriveUrl(driveType: DriveType, driveId: string): string {
  const id = assertDriveId(driveId);
  if (driveType === "folder") {
    return `https://drive.google.com/drive/folders/${id}`;
  }
  return `https://drive.google.com/file/d/${id}/view`;
}

export function normalizeDriveReference(input: DriveReference | string): DriveReference {
  if (typeof input === "string") {
    const parsed = parseGoogleDriveLink(input);
    return {
      driveType: parsed.driveType,
      driveId: parsed.driveId,
      originalDriveUrl: parsed.originalUrl,
    };
  }

  return {
    driveType: input.driveType,
    driveId: assertDriveId(input.driveId),
    originalDriveUrl: input.originalDriveUrl?.trim() || undefined,
  };
}

export function logParsedDriveLink(context: string, parsed: ParsedDriveLink): void {
  console.info(`[drive:${context}] link normalizado`, {
    originalUrl: parsed.originalUrl,
    driveType: parsed.driveType,
    driveId: parsed.driveId,
    payload: {
      driveType: parsed.driveType,
      driveId: parsed.driveId,
      originalDriveUrl: parsed.originalUrl,
    },
  });
}