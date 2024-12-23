"use client";

import FolderDuotone from "@/components/icons/folder-duotone";
import { ArrowRight } from "lucide-react";
import React from "react";
import Folder from "./folder";
import { useQueryData } from "@/hooks/useQueryData";
import { getWorkspaceFolders } from "@/actions/workspace";
import { useMutationDataState } from "@/hooks/useMutationData";
import { FoldersProps } from "@/types/index.type";

type Props = { workspaceId: string };

const Folders = ({ workspaceId }: Props) => {
  const { data, isFetching } = useQueryData(["workspace-folders"], () =>
    getWorkspaceFolders(workspaceId)
  );

  const { latestVariables } = useMutationDataState(["create-folder"]);
  const { status, data: folders } = data as FoldersProps;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FolderDuotone />
          <h2 className="text-[#BDBDBD] text-xl"> Folders</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[#BDBDBD]">See all</p>
          <ArrowRight color="#707070" />
        </div>
      </div>
      <section>
        <Folder name="Folder Title" />
      </section>
    </div>
  );
};

export default Folders;
