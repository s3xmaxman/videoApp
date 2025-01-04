import { client } from "@/lib/prisma";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const content = JSON.parse(body.content);

  const transcribed = await client.video.update({
    where: {
      userId: id,
      source: body.filename,
    },
    data: {
      title: content.title,
      description: content.summary,
      summery: content.transcript,
    },
  });

  if (transcribed) {
    console.log("transcribed", transcribed);
    return NextResponse.json({ status: 200 });
  }
}
