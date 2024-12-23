"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getWorkSpaces } from "@/actions/workspace";
import { useQueryData } from "@/hooks/useQueryData";
import { NotificationProps, WorkspaceProps } from "@/types/index.type";
import Modal from "../modal";
import { Loader, Menu, PlusCircle } from "lucide-react";
import Search from "../search";
import { MENU_ITEMS } from "@/constants";
import SidebarItem from "./sidebar-item";
import { getNotifications } from "@/actions/user";
import WorkspacePlaceholder from "./workspace-placeholder";
import GlobalCard from "../global-card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import InfoBar from "../info-bar";

type Props = {
  activeWorkspaceId: string;
};

const Sidebar = ({ activeWorkspaceId }: Props) => {
  const router = useRouter();
  const pathName = usePathname();
  const menuItems = MENU_ITEMS(activeWorkspaceId);

  const { data, isFetched } = useQueryData(["user-workspaces"], getWorkSpaces);
  const { data: notifications } = useQueryData(
    ["user-notifications"],
    getNotifications
  );

  const { data: workspace } = data as WorkspaceProps;
  const { data: count } = notifications as NotificationProps;

  const onChangeActiveWorkspace = (value: string) => {
    router.push(`/dashboard/${value}`);
  };

  const currentWorkspace = workspace.workspace.find(
    (workspace) => workspace.id === activeWorkspaceId
  );

  // SidebarSection コンポーネント：サイドバーの主要なコンテンツを構成します。
  const SidebarSection = (
    <div className="bg-[#111111] flex-none relative p-4 h-full w-[250px] flex flex-col gap-4 items-center overflow-hidden">
      {/* ロゴセクション：サイドバー上部にロゴとタイトルを表示します。 */}
      <div className="bg-[#111111] p-4 flex gap-2 justify-center items-center mb-4 absolute top-0 left-0 right-0 ">
        <Image src="/opal-logo.svg" height={40} width={40} alt="logo" />
        <p className="text-2xl">Opal</p>
      </div>
      {/* ワークスペース選択セクション：ユーザーがワークスペースを選択するためのドロップダウンメニューを提供します。 */}
      <Select
        defaultValue={activeWorkspaceId}
        onValueChange={onChangeActiveWorkspace}
      >
        <SelectTrigger className="mt-16 text-neutral-400 bg-transparent">
          <SelectValue placeholder="ワークスペースを選択"></SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#111111] backdrop-blur-xl">
          <SelectGroup>
            <SelectLabel>ワークスペース</SelectLabel>
            <Separator />
            {/* ユーザーが所有するワークスペースをリスト表示します。 */}
            {workspace.workspace.map((workspace) => (
              <SelectItem value={workspace.id} key={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
            {/* ユーザーがメンバーとして参加しているワークスペースをリスト表示します。 */}
            {workspace.members.length > 0 &&
              workspace.members.map(
                (workspace) =>
                  workspace.WorkSpace && (
                    <SelectItem
                      value={workspace.WorkSpace.id}
                      key={workspace.WorkSpace.id}
                    >
                      {workspace.WorkSpace.name}
                    </SelectItem>
                  )
              )}
          </SelectGroup>
        </SelectContent>
      </Select>
      {/* ワークスペース招待モーダル：パブリックワークスペースかつPROプランの場合に表示されます。 */}
      {currentWorkspace?.type === "PUBLIC" &&
        workspace.subscription?.plan == "PRO" && (
          <Modal
            trigger={
              <span className="text-sm cursor-pointer flex items-center justify-center bg-neutral-800/90  hover:bg-neutral-800/60 w-full rounded-sm p-[5px] gap-2">
                <PlusCircle
                  size={15}
                  className="text-neutral-800/90 fill-neutral-500"
                />
                <span className="text-neutral-400 font-semibold text-xs">
                  ワークスペースに招待
                </span>
              </span>
            }
            title="ワークスペースに招待"
            description="他のユーザーをワークスペースに招待します"
          >
            <Search workspaceId={activeWorkspaceId} />
          </Modal>
        )}
      {/* メニューセクション：サイドバーのメインメニュー項目を表示します。 */}
      <p className="w-full text-[#9D9D9D] font-bold mt-4">メニュー</p>
      <nav className="w-full">
        <ul>
          {menuItems.map((item) => (
            <SidebarItem
              href={item.href}
              icon={item.icon}
              selected={pathName === item.href}
              title={item.title}
              key={item.title}
              notifications={
                (item.title === "通知" &&
                  count._count &&
                  count._count.notification) ||
                0
              }
            />
          ))}
        </ul>
      </nav>
      <Separator className="w-4/5" />
      {/* ワークスペースリストセクション：ユーザーがアクセス可能なワークスペースをリスト表示します。 */}
      <p className="w-full text-[#9D9D9D] font-bold mt-4 ">ワークスペース</p>
      {/* ワークスペースがない場合のメッセージを表示します。 */}
      {workspace.workspace.length === 1 && workspace.members.length === 0 && (
        <div className="w-full mt-[-10px]">
          <p className="text-[#3c3c3c] font-medium text-sm">
            {workspace.subscription?.plan === "FREE"
              ? "ワークスペースを作成するにはアップグレードしてください"
              : "ワークスペースはありません"}
          </p>
        </div>
      )}
      {/* ワークスペースリスト：ユーザーが所有またはメンバーとして参加しているワークスペースをリスト表示します。 */}
      <nav className="w-full">
        <ul className="h-[150px] overflow-auto overflow-x-hidden fade-layer">
          {workspace.workspace.length > 0 &&
            workspace.workspace.map(
              (item) =>
                item.type !== "PERSONAL" && (
                  <SidebarItem
                    href={`/dashboard/${item.id}`}
                    selected={pathName === `/dashboard/${item.id}`}
                    title={item.name}
                    notifications={0}
                    key={item.name}
                    icon={
                      <WorkspacePlaceholder>
                        {item.name.charAt(0)}
                      </WorkspacePlaceholder>
                    }
                  />
                )
            )}
          {workspace.members.length > 0 &&
            workspace.members.map((item) => (
              <SidebarItem
                href={`/dashboard/${item.WorkSpace.id}`}
                selected={pathName === `/dashboard/${item.WorkSpace.id}`}
                title={item.WorkSpace.name}
                notifications={0}
                key={item.WorkSpace.name}
                icon={
                  <WorkspacePlaceholder>
                    {item.WorkSpace.name.charAt(0)}
                  </WorkspacePlaceholder>
                }
              />
            ))}
        </ul>
      </nav>
      <Separator className="w-4/5" />
      {/* PROプランへのアップグレードを促すカードを表示します。 */}
      {workspace.subscription?.plan === "FREE" && (
        <GlobalCard
          title="Proにアップグレード"
          description="文字起こし、AI要約などのAI機能を利用可能にします。"
          footer={<Button>今すぐアップグレード</Button>}
        />
      )}
    </div>
  );

  return (
    <div className="full">
      <InfoBar />
      {/* モバイルビュー用のシートコンポーネント：サイドバーを隠してメニューボタンで表示します。 */}
      <div className="md:hidden fixed my-4">
        <Sheet>
          <SheetTrigger asChild className="ml-2">
            <Button variant={"ghost"} className="mt-[2px]">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side={"left"} className="p-0 w-fit h-full">
            <SheetTitle className="hidden"></SheetTitle>
            {SidebarSection}
          </SheetContent>
        </Sheet>
      </div>
      {/* デスクトップビュー用のサイドバー：常に表示されます。 */}
      <div className="md:block hidden h-full">{SidebarSection}</div>
    </div>
  );
};

export default Sidebar;
