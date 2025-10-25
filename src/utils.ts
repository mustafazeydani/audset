import { IncomingMessage } from "http";

export const progress = (res: IncomingMessage) => {
  const totalSize = parseInt(res.headers["content-length"] as string, 10); // Total size in bytes
  let downloaded = 0;

  if (!totalSize || isNaN(totalSize)) {
    throw new Error("Unable to determine total size for progress tracking.");
  }

  res.on("data", (chunk) => {
    downloaded += chunk.length;
    const percent = ((downloaded / totalSize) * 100).toFixed(2);
    const downloadedSize = getSize(downloaded);
    const totalSizeFormatted = getSize(totalSize); 
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(
      `Progress: ${percent}% - [Downloaded: ${downloadedSize} / Total: ${totalSizeFormatted}]`
    );
  });

  res.on("end", () => {
    process.stdout.write("\nDownload completed!\n");
  });
};

const getSize = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};