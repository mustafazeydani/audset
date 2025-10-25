import type { ArgvType } from "./yargsConfig";
import ytdl from "@distube/ytdl-core";
import type { Readable } from "stream";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

export class Downloader {
  args: ArgvType;
  outputDirectory: string;

  constructor(args: ArgvType, outputDirectory: string) {
    this.args = args;
    this.outputDirectory = outputDirectory;
  }

  async getVideoStream() {
    const { url } = this.args;

    try {
      if (!ytdl.validateURL(url)) {
        throw new Error("Invalid YouTube URL");
      }

      console.log("Starting download process...");

      const info = await ytdl.getInfo(url);

      console.log("Downloading video:", info.videoDetails.title);

      return ytdl(url, {
        filter: "audioandvideo",
        quality: "highestaudio",
      });
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

  async saveFile(videoStream: Readable) {
    const { extension, threshold, datasetName } = this.args;
    const filePath = path.resolve(
      this.outputDirectory,
      `${datasetName}.${extension}`
    );

    return new Promise<string>((resolve, reject) => {
      try {
        ffmpeg(videoStream)
          .audioCodec("libmp3lame")
          .audioBitrate(192)
          .toFormat(extension)
          .audioFilters(
            `silenceremove=start_periods=1:start_duration=0.5:start_threshold=${threshold}dB`
          )
          .on("error", (err) => {
            console.error(err.message);
            reject(new Error(err.message)); // Reject the promise on error
          })
          .on("end", () => {
            console.log("File saved successfully!");
            resolve(filePath); // Resolve the promise when the process ends
          })
          .save(filePath);
      } catch (error) {
        console.error(error.message);
        reject(error); // Reject the promise if there's an error
      }
    });
  }
}
