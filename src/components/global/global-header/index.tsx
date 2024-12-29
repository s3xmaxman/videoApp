"use client";

import { WorkSpace } from "@prisma/client";
import { usePathname } from "next/navigation";
import React from "react";

type Props = {
  workspace: WorkSpace;
};

const GlobalHeader = ({ workspace }: Props) => {
  const pathName = usePathname().split(`/dashboard/${workspace.id}`)[1];

  const getHeaderTitle = (pathName: string) => {
    if (!pathName) return "My Library";

    if (pathName.includes("folder") || pathName.includes("video")) {
      return pathName.includes("video") ? "" : "My Library";
    }

    return pathName.charAt(1).toUpperCase() + pathName.slice(2).toLowerCase();
  };

  return (
    <article className="flex flex-col gap-2">
      <span className="text-[#707070] text-xs">
        {pathName.includes("video") ? "" : workspace.type.toLocaleUpperCase()}
      </span>
      <h1 className="text-4xl font-bold">{getHeaderTitle(pathName)}</h1>
    </article>
  );
};

export default GlobalHeader;
