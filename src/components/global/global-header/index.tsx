"use client";

import { WorkSpace } from "@prisma/client";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  workspace: WorkSpace;
};

const GlobalHeader = ({ workspace }: Props) => {
  const pathName = usePathname().split(`/dashboard/${workspace.id}`)[1];
  return (
    <article className="flex flex-col gap-2">
      <span className="text-[#707070] text-xs">
        {pathName.includes("video") ? "" : workspace.type.toLocaleUpperCase()}
      </span>
      <h1 className="text-4xl font-bold">
        {/* 現在のパス名に基づいてヘッダーのタイトルを決定します。 */}
        {pathName && !pathName.includes("folder") && !pathName.includes("video")
          ? // パス名が存在し、かつ "folder" や "video" を含まない場合、
            // パス名の2文字目を大文字にし、残りを小文字にして表示します。
            pathName.charAt(1).toUpperCase() + pathName.slice(2).toLowerCase()
          : pathName.includes("video")
          ? // パス名に "video" が含まれる場合は、空の文字列を表示します。
            ""
          : // それ以外の場合は、"My Library" を表示します。
            "My Library"}
      </h1>
    </article>
  );
};

export default GlobalHeader;
