import { Server } from "socket.io";
import fs from "fs";
import express from "express";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Readable } from "stream";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import OpenAi from "openai";

let recordedChunks = [];

const app = express();
const server = http.createServer(app);

dotenv.config();
app.use(cors());

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_ELECTRON_HOST,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("video-chunks", async (data) => {
    console.log("Video chunk is sent", data);
    const writeStream = fs.createWriteStream(`temp_upload/${data.filename}`);
    recordedChunks.push(data.chunks);

    const videoBlob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    const readStream = Readable.from(buffer);

    readStream.pipe(writeStream).on("finish", async () => {
      console.log("Chunk Saved");
    });
  });
});

socket.on("process-video", async (data) => {
  console.log("Processing video", data);
  recordedChunks = [];

  fs.readFile("temp_upload" + data.filename, async (err, data) => {
    const processing = await axios.post(
      `${process.env.NEXT_API_HOST}recording/${data.userId}/processing`,
      {
        filename: data.filename,
      }
    );

    if (processing.data.status !== 200) {
      console.log(
        processing.data,
        "ERROR SOMETHING WENT WRONG WITH CREATING THE PROCESSING FILE"
      );
    }

    const Key = data.filename;
    const Bucket = process.env.BUCKET_NAME;
    const ContentType = "video/webm";

    const command = new PutObjectCommand({
      Key,
      Bucket,
      ContentType,
      Body: file,
    });

    const fileStatus = await s3.send(command);
  });
});

server.listen(5001, () => {
  console.log("Server running on port 5001");
});
