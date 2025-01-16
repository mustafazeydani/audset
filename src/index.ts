import ytdl from "@distube/ytdl-core";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import chokidar from "chokidar";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const datasetsDirectory = path.resolve("datasets");
const tempDirectory = path.resolve(datasetsDirectory, "tmp");

rl.question("Enter the YouTube URL: ", (url) => {
  rl.question(
    "Enter the name of the dataset (default: example_dataset): ",
    (datasetName) => {
      rl.question(
        "Enter the length of each segment in seconds (default: 10): ",
        (segmentLength) => {
          rl.question(
            "Enter the start threshhold in DB (below which audio is considered silent) (higher DB for louder background noise, lower DB for quite background noise) (default: -50): ",
            (threshhold) => {
              const finalDatasetName = datasetName || "example_dataset";
              const finalSegmentLength = parseInt(segmentLength) || 10;
              const finalThreshhold = parseInt(threshhold) || -50;
              downloadAndConvertToMP3(
                url,
                finalSegmentLength,
                finalDatasetName,
                finalThreshhold
              );
              rl.close();
            }
          );
        }
      );
    }
  );
});

const downloadAndConvertToMP3 = async (
  url: string,
  segmentLength: number,
  datasetName: string,
  threshhold: number
) => {
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const outputDirectory = path.resolve(datasetsDirectory, datasetName);

    console.log("Starting download and conversion process...");

    const info = await ytdl.getInfo(url);

    if (!fs.existsSync(tempDirectory)) {
      fs.mkdirSync(tempDirectory, { recursive: true });
    }

    const tempFilePath = path.resolve(tempDirectory, `${datasetName}.mp3`);

    console.log("Downloading video:", info.videoDetails.title);

    const videoStream = ytdl(url, {
      filter: "audioandvideo",
      quality: "highestaudio",
    });

    videoStream.on("response", (res) => {
      const totalSize = parseInt(res.headers["content-length"], 10); // Total size in bytes
      let downloaded = 0;

      if (!totalSize || isNaN(totalSize)) {
        console.error("Unable to determine total size for progress tracking.");
        return;
      }

      res.on("data", (chunk: string | any[]) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(2);
        const downloadedMB = (downloaded / (1024 * 1024)).toFixed(2); // Convert to MB
        const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2); // Convert to MB
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(
          `Progress: ${percent}% - [Downloaded: ${downloadedMB} MB / Total: ${totalSizeMB} MB]`
        );
      });

      res.on("end", () => {
        process.stdout.write("\nDownload completed!\n");
      });
    });

    ffmpeg(videoStream)
      .audioCodec("libmp3lame")
      .audioBitrate(192)
      .toFormat("mp3")
      .audioFilters(
        `silenceremove=start_periods=1:start_duration=0.5:start_threshold=${threshhold}dB`
      )
      .on("error", (err) => {
        console.error("Error during conversion:", err.message);
      })
      .on("end", () => {
        console.log("Conversion to MP3 completed.");
        splitMP3File(tempFilePath, segmentLength, datasetName, outputDirectory); // Split the MP3 after conversion
      })
      .save(tempFilePath);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

const splitMP3File = async (
  filePath: string,
  segmentLength: number,
  datasetName: string,
  outputDirectory: string
) => {
  try {
    const segmentDuration = segmentLength;
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

    const totalSegments = Math.ceil(fileDuration / segmentDuration);
    const isLastSegmentShort = fileDuration % segmentDuration !== 0;

    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const watcher = chokidar.watch(outputDirectory, { ignoreInitial: true });

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
      .format("mp3")
      .audioCodec("libmp3lame")
      .audioBitrate(192)
      .on("error", (err) => {
        console.error("Error during splitting:", err.message);
        watcher.close();
      })
      .on("end", async () => {
        console.log("\nSegmentation completed.");

        try {
          if (fs.existsSync(tempDirectory)) {
            fs.rm(tempDirectory, { recursive: true }, (err) => {
              if (err) {
                console.error(
                  `Error deleting temporary directory: ${err.message}`
                );
              } else {
                console.log("Deleted temporary directory:", tempDirectory);
              }
            });
          }
        } catch (err) {
          console.error(`Error deleting temporary file: ${err.message}`);
        }

        // Delete last segment if it is shorter than the specified duration
        try {
          if (isLastSegmentShort) {
            const lastSegmentPath = path.resolve(
              outputDirectory,
              `${datasetName}_${totalSegments.toString().padStart(3, "0")}.mp3`
            );
            if (fs.existsSync(lastSegmentPath)) {
              fs.unlinkSync(lastSegmentPath);
              console.log(`Deleted last segment: ${lastSegmentPath}`);
            }
          }
        } catch (error) {
          console.error("Error deleting last segment:", error.message);
        }
        watcher.close();
      })
      .outputOptions([
        `-f segment`,
        `-segment_time ${segmentDuration}`,
        `-reset_timestamps 1`,
        `-map 0`,
        `-segment_start_number 1`,
      ])
      .output(path.resolve(outputDirectory, `${datasetName}_%03d.mp3`))
      .run();
  } catch (error) {
    console.error("Error during splitting:", error.message);
  }
};
