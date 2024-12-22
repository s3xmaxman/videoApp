"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import { getWorkSpaces } from "@/actions/workspace";
import { useQueryData } from "@/hooks/useQueryData";

type Props = {
  activeWorkspaceId: string;
};

const Sidebar = ({ activeWorkspaceId }: Props) => {
  const router = useRouter();

  const { data, isFetched } = useQueryData(["user-workspaces"], getWorkSpaces);

  const onChangeActiveWorkspace = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  return (
    <div className="bg-[#111111] flex-none relative p-4 h-full w-[250px] flex flex-col gap-4 items-center overflow-hidden">
      <div className="bg-[#111111] p-4 flex gap-2 justify-center items-center mb-4 absolute top-0 left-0 right-0">
        <Image src={"/opal-logo.svg"} alt="logo" width={40} height={40} />
        <p className="text-2xl">Opal</p>
      </div>
      <Select
        defaultValue={activeWorkspaceId}
        onValueChange={onChangeActiveWorkspace}
      >
        <SelectTrigger className="mt-16 text-neutral-400 bg-transparent">
          <SelectValue placeholder="ワークスペースを選択"></SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#111111] backdrop-blur-xl">
          <SelectGroup>
            <SelectLabel>WorkSpaces</SelectLabel>
            <Separator />
            {}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default Sidebar;
