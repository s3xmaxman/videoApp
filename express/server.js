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

const app = express();
const server = http.createServer(app);

dotenv.config();
app.use(cors());

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
  });
});

server.listen(5001, () => {
  console.log("Server running on port 5001");
});
