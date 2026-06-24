import { describe, expect, it } from "vitest";
import { buildGoogleDriveUrl, parseGoogleDriveLink } from "@/lib/google-drive-link";

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
});