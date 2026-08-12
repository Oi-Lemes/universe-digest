import { driveProxyHeaders, fileContentUrl } from "@/lib/drive";

/**
 * Converte um quadrinho compactado (CBZ/CBR/ZIP/RAR) em um EPUB de imagens,
 * inteiramente no navegador. O EPUB gerado é aceito pelo "Enviar para Kindle"
 * (e-mail @kindle.com ou sendtokindle.amazon.com), ao contrário do CBZ.
 */

const IMAGE_RE = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

type Progress = (message: string) => void;

const mimeFor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "bmp") return "image/bmp";
  if (ext === "avif") return "image/avif";
  return "image/jpeg";
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const pad = (n: number) => String(n).padStart(4, "0");

const baseName = (fileName: string) => fileName.replace(/\.[^.]+$/, "");

async function fetchArchive(
  fileId: string,
  fileName: string,
  onProgress: Progress
): Promise<Blob> {
  const res = await fetch(fileContentUrl(fileId, fileName), {
    cache: "no-store",
    headers: driveProxyHeaders(),
  });
  if (!res.ok) throw new Error(`Falha no download (${res.status})`);

  const total = Number(res.headers.get("content-length") || 0);
  const reader = res.body?.getReader();
  if (!reader) return res.blob();

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.byteLength;
    onProgress(
      total
        ? `Baixando… ${Math.round((received / total) * 100)}%`
        : `Baixando… ${(received / 1024 / 1024).toFixed(1)} MB`
    );
  }
  return new Blob(chunks as BlobPart[]);
}

/**
 * Extrai as imagens do arquivo compactado, em ordem natural de leitura.
 */
async function extractImages(
  blob: Blob,
  fileName: string,
  onProgress: Progress
): Promise<{ name: string; data: Uint8Array }[]> {
  const { Archive } = await import("libarchive.js");
  Archive.init({ workerUrl: "/libarchive/worker-bundle.js" });

  const archive = await Archive.open(
    new File([blob], fileName, { type: "application/octet-stream" })
  );
  const entries = (await archive.getFilesArray())
    .filter((e: { file: { name: string } }) => IMAGE_RE.test(e.file.name))
    .sort(
      (
        a: { file: { name: string }; path: string },
        b: { file: { name: string }; path: string }
      ) =>
        `${a.path}${a.file.name}`.localeCompare(`${b.path}${b.file.name}`, undefined, {
          numeric: true,
        })
    );

  if (entries.length === 0) {
    throw new Error("Nenhuma imagem encontrada dentro do arquivo.");
  }

  const out: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const file: Blob = await entries[i].file.extract();
    out.push({
      name: entries[i].file.name,
      data: new Uint8Array(await file.arrayBuffer()),
    });
    if (i % 5 === 0) onProgress(`Convertendo… ${i + 1}/${entries.length}`);
  }
  return out;
}

/**
 * Monta o pacote EPUB 3 (com fallback EPUB 2 via toc.ncx) a partir das imagens.
 */
async function buildEpub(
  title: string,
  images: { name: string; data: Uint8Array }[]
): Promise<Blob> {
  const { zipSync, strToU8 } = await import("fflate");

  const uid = `urn:uuid:${crypto.randomUUID()}`;
  const safeTitle = escapeXml(title);

  const manifest: string[] = [];
  const spine: string[] = [];
  const navItems: string[] = [];
  const ncxItems: string[] = [];

  const files: Record<string, [Uint8Array, { level: number }]> = {};

  images.forEach((img, i) => {
    const ext = img.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const imgHref = `images/p${pad(i + 1)}.${ext}`;
    const pageHref = `pages/p${pad(i + 1)}.xhtml`;

    // Imagens já vêm comprimidas — armazenar sem recomprimir (level 0) é bem mais rápido.
    files[`OEBPS/${imgHref}`] = [img.data, { level: 0 }];
    files[`OEBPS/${pageHref}`] = [
      strToU8(
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${i + 1}</title><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>html,body{margin:0;padding:0;text-align:center;background:#fff}img{max-width:100%;height:auto}</style>
</head>
<body><div><img src="../${imgHref}" alt="Página ${i + 1}"/></div></body>
</html>`
      ),
      { level: 6 },
    ];

    manifest.push(
      `<item id="img${i + 1}" href="${imgHref}" media-type="${mimeFor(img.name)}"${
        i === 0 ? ' properties="cover-image"' : ""
      }/>`,
      `<item id="pg${i + 1}" href="${pageHref}" media-type="application/xhtml+xml"/>`
    );
    spine.push(`<itemref idref="pg${i + 1}"/>`);
    navItems.push(`<li><a href="${pageHref}">Página ${i + 1}</a></li>`);
    ncxItems.push(
      `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>Página ${
        i + 1
      }</text></navLabel><content src="${pageHref}"/></navPoint>`
    );
  });

  files["mimetype"] = [strToU8("application/epub+zip"), { level: 0 }];
  files["META-INF/container.xml"] = [
    strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
    ),
    { level: 6 },
  ];
  files["OEBPS/nav.xhtml"] = [
    strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${safeTitle}</title></head>
<body><nav epub:type="toc" id="toc"><h1>${safeTitle}</h1><ol>${navItems.join("")}</ol></nav></body>
</html>`
    ),
    { level: 6 },
  ];
  files["OEBPS/toc.ncx"] = [
    strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${uid}"/></head>
  <docTitle><text>${safeTitle}</text></docTitle>
  <navMap>${ncxItems.join("")}</navMap>
</ncx>`
    ),
    { level: 6 },
  ];
  files["OEBPS/content.opf"] = [
    strToU8(
      `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" prefix="rendition: http://www.idpf.org/vocab/rendition/#">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uid}</dc:identifier>
    <dc:title>${safeTitle}</dc:title>
    <dc:language>pt-BR</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:spread">auto</meta>
    <meta name="cover" content="img1"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${manifest.join("\n    ")}
  </manifest>
  <spine toc="ncx">${spine.join("")}</spine>
</package>`
    ),
    { level: 6 },
  ];

  const zipped = zipSync(files as never, { level: 0 });
  return new Blob([zipped as unknown as BlobPart], { type: "application/epub+zip" });
}

export type EpubDelivery = "shared" | "downloaded";

/**
 * Baixa o arquivo, converte para EPUB e entrega ao usuário.
 *
 * No iPhone/iPad o atributo `download` é ignorado (o arquivo some sem aviso),
 * então usamos a folha de compartilhamento do iOS — de lá dá pra "Salvar em
 * Arquivos" ou mandar direto pro app Kindle / e-mail @kindle.com.
 */
export async function downloadAsEpub(
  fileId: string,
  fileName: string,
  onProgress: Progress = () => {}
): Promise<EpubDelivery> {
  onProgress("Baixando arquivo…");
  const blob = await fetchArchive(fileId, fileName, onProgress);

  onProgress("Descomprimindo páginas…");
  const images = await extractImages(blob, fileName, onProgress);

  onProgress("Montando EPUB…");
  const title = baseName(fileName);
  const epub = await buildEpub(title, images);
  const outName = `${title}.epub`;

  const file = new File([epub], outName, { type: "application/epub+zip" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      onProgress("Abrindo compartilhamento…");
      await nav.share({ files: [file], title: outName });
      return "shared";
    } catch (e) {
      // Usuário cancelou a folha de compartilhamento — não é erro.
      if (e instanceof DOMException && e.name === "AbortError") return "shared";
    }
  }

  const url = URL.createObjectURL(epub);
  const link = document.createElement("a");
  link.href = url;
  link.download = outName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded";
}

