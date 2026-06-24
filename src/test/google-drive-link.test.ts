import { describe, expect, it } from "vitest";
import {
  buildGoogleDriveUrl,
  normalizeGoogleDriveUrl,
  parseGoogleDriveLink,
} from "@/lib/google-drive-link";
import { IMPERIO_DRIVE_ROOT_REFERENCE, IMPERIO_DRIVE_ROOT_URL } from "@/lib/imperio-drive";

describe("google-drive-link mobile/u-N variants", () => {
  it("normaliza /drive/u/0/mobile/folders/{id} para a URL canônica", () => {
    const url =
      "https://drive.google.com/drive/u/0/mobile/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW";
    expect(parseGoogleDriveLink(url)).toMatchObject({
      driveType: "folder",
      driveId: "1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW",
    });
    expect(normalizeGoogleDriveUrl(url)).toBe(
      "https://drive.google.com/drive/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW"
    );
  });

  it("normaliza /drive/u/2/folders/{id}", () => {
    expect(
      normalizeGoogleDriveUrl("https://drive.google.com/drive/u/2/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW?usp=sharing")
    ).toBe("https://drive.google.com/drive/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW");
  });

  it("normaliza /u/0/uc?id={id} para /file/d/{id}/view", () => {
    expect(
      normalizeGoogleDriveUrl("https://drive.google.com/u/0/uc?id=1AbCdEfGhIjKlMnOpQrStUvWxYz_12345&export=download")
    ).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/view");
  });

  it("normaliza /u/0/mobile/file/d/{id}/view", () => {
    expect(
      normalizeGoogleDriveUrl("https://drive.google.com/u/0/mobile/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/view")
    ).toBe("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/view");
  });

  it("URL inválida retorna null em normalizeGoogleDriveUrl", () => {
    expect(normalizeGoogleDriveUrl("https://example.com/x")).toBeNull();
  });
});

describe("google-drive-link", () => {
  it("extrai pasta de link /drive/folders", () => {
    expect(
      parseGoogleDriveLink(" https://drive.google.com/drive/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW?usp=drive_link ")
    ).toEqual({
      driveType: "folder",
      driveId: "1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW",
      originalUrl: "https://drive.google.com/drive/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW?usp=drive_link",
    });
  });

  it("extrai arquivo de link /file/d", () => {
    expect(parseGoogleDriveLink("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/view?usp=sharing")).toMatchObject({
      driveType: "file",
      driveId: "1AbCdEfGhIjKlMnOpQrStUvWxYz_12345",
    });
  });

  it("extrai arquivo de link open?id", () => {
    expect(parseGoogleDriveLink("https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz_12345")).toMatchObject({
      driveType: "file",
      driveId: "1AbCdEfGhIjKlMnOpQrStUvWxYz_12345",
    });
  });

  it("extrai arquivo de link uc?id", () => {
    expect(parseGoogleDriveLink("https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUvWxYz_12345&export=download")).toMatchObject({
      driveType: "file",
      driveId: "1AbCdEfGhIjKlMnOpQrStUvWxYz_12345",
    });
  });

  it("extrai arquivo de docs.google.com", () => {
    expect(parseGoogleDriveLink("https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/edit")).toMatchObject({
      driveType: "file",
      driveId: "1AbCdEfGhIjKlMnOpQrStUvWxYz_12345",
    });
  });

  it("reconstrói somente a URL oficial por tipo/id", () => {
    expect(buildGoogleDriveUrl("folder", "1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW")).toBe(
      "https://drive.google.com/drive/folders/1k-vGJSHIdFxzbwRF17BsN7tBZWXLb-RW"
    );
    expect(buildGoogleDriveUrl("file", "1AbCdEfGhIjKlMnOpQrStUvWxYz_12345")).toBe(
      "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz_12345/view"
    );
  });

  it("usa driveType + driveId como fonte única do botão principal", () => {
    expect(IMPERIO_DRIVE_ROOT_REFERENCE).toMatchObject({
      driveType: "folder",
      driveId: "11SVA323KWtChNn9SdhfqhhkewLlsy683",
    });
    expect(IMPERIO_DRIVE_ROOT_URL).toBe(
      "https://drive.google.com/drive/folders/11SVA323KWtChNn9SdhfqhhkewLlsy683"
    );
  });
});