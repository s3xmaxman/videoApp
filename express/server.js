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

// ExpressとSocket.IOの初期化
const app = express();
const server = http.createServer(app);

dotenv.config();
app.use(cors());

// Socket.IOの設定
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_ELECTRON_HOST,
    methods: ["GET", "POST"],
  },
});

// AWS S3クライアントの初期化
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  region: process.env.BUCKET_REGION,
});

// OpenAIクライアントの初期化
const openai = new OpenAi({
  apiKey: process.env.OPEN_AI_KEY,
});

let recordedChunks = [];

// ヘルパー関数
async function uploadToS3(filename, file) {
  const Key = filename;
  const Bucket = process.env.BUCKET_NAME;
  const ContentType = "video/webm";

  const command = new PutObjectCommand({
    Key,
    Bucket,
    ContentType,
    Body: file,
  });

  return await s3.send(command);
}

async function processVideoTranscription(filename, userId, transcription) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate title and description from transcription: ${transcription}. Return as {"title":<title>,"summary":<summary>}`,
        },
      ],
    });

    const response = await axios.post(
      `${process.env.NEXT_API_HOST}recording/${userId}/transcribe`,
      {
        filename,
        content: completion.choices[0].message.content,
        transcript: transcription,
      }
    );

    if (response.data.status !== 200) {
      throw new Error("Failed to save transcription");
    }
  } catch (error) {
    console.error("文字起こし処理エラー:", error);
  }
}

async function handleVideoProcessing(data) {
  try {
    const filePath = `temp_upload/${data.filename}`;
    const file = await fs.promises.readFile(filePath);

    // 処理の開始
    const processingResponse = await axios.post(
      `${process.env.NEXT_API_HOST}recording/${data.userId}/processing`,
      { filename: data.filename }
    );

    if (processingResponse.data.status !== 200) {
      throw new Error("Failed to start processing");
    }

    // S3へのアップロード
    const uploadResult = await uploadToS3(data.filename, file);
    if (uploadResult["$metadata"].httpStatusCode !== 200) {
      throw new Error("Failed to upload to S3");
    }

    console.log("AWSへの動画アップロード完了");

    // PROプランの機能を処理
    if (processingResponse.data.plan === "PRO") {
      const stats = await fs.promises.stat(filePath);
      if (stats.size < 25000000) {
        // 25MB制限
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(filePath),
          model: "whisper-1",
          response_format: "text",
        });

        if (transcription) {
          await processVideoTranscription(
            data.filename,
            data.userId,
            transcription
          );
        }
      }
    }

    // 処理の完了
    const completeResponse = await axios.post(
      `${process.env.NEXT_API_HOST}recording/${data.userId}/complete`,
      { filename: data.filename }
    );

    if (completeResponse.status !== 200) {
      throw new Error("Failed to complete processing");
    }

    // 一時ファイルの削除
    await fs.promises.unlink(filePath);
    console.log(`${data.filename} の削除に成功しました`);
  } catch (error) {
    console.error("動画処理エラー:", error);
  }
}

// Socket.IOイベントハンドラ
io.on("connection", (socket) => {
  console.log("ソケット接続完了:", socket.id);

  socket.on("video-chunks", async (data) => {
    console.log("動画チャンク受信中:", data.filename);

    const writeStream = fs.createWriteStream(`temp_upload/${data.filename}`);
    recordedChunks.push(data.chunks);

    const videoBlob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await videoBlob.arrayBuffer());
    const readStream = Readable.from(buffer);

    readStream.pipe(writeStream).on("finish", () => {
      console.log("チャンク保存完了:", data.filename);
    });
  });

  socket.on("process-video", async (data) => {
    console.log("動画処理中:", data.filename);
    recordedChunks = [];
    await handleVideoProcessing(data);
  });

  socket.on("disconnect", () => {
    console.log("ソケット切断:", socket.id);
  });
});

// サーバーの起動
server.listen(5001, () => {
  console.log("サーバーがポート5001で起動中");
});
