import { client } from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

/**
 * 録音データの文字起こし結果を処理するAPIエンドポイント
 *
 * @param req NextRequestオブジェクト
 * @param params パスパラメータ（Promise<{ id: string }>）
 * @returns NextResponse 処理結果を返す
 *
 * このAPIは以下の処理を行う:
 * 1. リクエストボディからデータを取得
 * 2. パスパラメータからユーザーIDを取得
 * 3. ビデオデータを更新（タイトル、説明、文字起こし結果を保存）
 * 4. Voiceflowのナレッジベースを更新
 * 5. 処理結果を返す
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const content = JSON.parse(body.content);

  // ビデオデータを更新
  const transcribed = await client.video.update({
    where: {
      userId: id,
      source: body.filename,
    },
    data: {
      title: content.title,
      description: content.summary,
      summery: body.transcript,
    },
  });

  if (transcribed) {
    // Voiceflowのナレッジベース更新用オプション
    const options = {
      method: "POST",
      url: process.env.VOICEFLOW_KNOWLEDGE_BASE_API,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: process.env.VOICEFLOW_API_KEY,
      },
      data: {
        data: {
          schema: {
            searchableFields: ["title", "transcript"],
            metadataFields: ["title", "transcript"],
          },
          name: content.title,
          items: [
            {
              title: content.title,
              transcript: body.transcript,
            },
          ],
        },
      },
    };

    // Voiceflow APIを呼び出してナレッジベースを更新
    const updateKB = await axios.request(options);

    // 更新結果をログに出力し、成功ステータスを返す
    if (updateKB.status === 200 || updateKB.status !== 200) {
      console.log(updateKB.data);
      return NextResponse.json({ status: 200 });
    }
  }

  // エラー発生時
  console.log("🔴 Transcription went wrong");
  return NextResponse.json({ status: 400 });
}
