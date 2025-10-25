import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import chokidar from "chokidar";

import type { ArgvType } from "./yargsConfig";

export class Segmenter {
  args: ArgvType;
  outputDirectory: string;

  constructor(args: ArgvType, outputDirectory: string) {
    this.args = args;
    this.outputDirectory = outputDirectory;
  }

  async segmentFile(filePath: string) {
    const { segmentLength, keepOriginal, extension, datasetName } = this.args;
    let segmentCounter = 1;

    const fileDuration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);
        const duration = metadata.format.duration;
        if (!duration)
          return reject(new Error("Unable to retrieve file duration."));
        resolve(duration);
      });
    });

    const totalSegments = Math.ceil(fileDuration / segmentLength);
    const isLastSegmentShort = fileDuration % segmentLength !== 0;

    const watcher = chokidar.watch(this.outputDirectory, {
      ignoreInitial: true,
    });

    watcher.on("add", async (file) => {
      if (isLastSegmentShort && segmentCounter === totalSegments) return;
      const fileName = path.basename(file);
      process.stdout.cursorTo(0);
      process.stdout.clearLine(1);
      process.stdout.write(
        `Segmentation progress: ${segmentCounter}/${
          isLastSegmentShort ? totalSegments - 1 : totalSegments
        } - [Segment: ${fileName}]`
      );
      segmentCounter++;
    });

    ffmpeg(filePath)
      .format(extension)
      .audioCodec("libmp3lame")
      .audioBitrate(192)
      .on("error", (err) => {
        console.error("Error during splitting:", err.message);
        watcher.close();
      })
      .on("end", async () => {
        console.log("\nSegmentation completed.");
        watcher.close();

        if (!keepOriginal) {
          if (isLastSegmentShort) {
            const lastSegmentPath = path.resolve(
              this.outputDirectory,
              `${datasetName}_${totalSegments
                .toString()
                .padStart(3, "0")}.${extension}`
            );
            if (fs.existsSync(lastSegmentPath)) {
              fs.unlinkSync(lastSegmentPath);
              console.log(`Deleted last segment: ${lastSegmentPath}`);
            }
          }
        }
      })
      .outputOptions([
        `-f segment`,
        `-segment_time ${segmentLength}`,
        `-reset_timestamps 1`,
        `-map 0`,
        `-segment_start_number 1`,
      ])
      .output(path.resolve(this.outputDirectory, `${datasetName}_%03d.mp3`))
      .run();
    try {
      // Split the file into segments
    } catch (error) {
      console.error(error.message);
    }
  }
}
