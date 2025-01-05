import { useAppSelector } from "@/redux/store";
import { useEffect, useState } from "react";
import { useMutationData } from "./useMutationData";
import { getWorkspaceFolders, moveVideoLocation } from "@/actions/workspace";
import { moveVideoSchema } from "@/components/forms/change-video-location/schema";
import useZodForm from "./useZodForm";

/**
 * 動画の移動処理を扱うカスタムフック。
 * @param videoId - 移動する動画のID。
 * @param currentWorkspace - 現在のワークスペースID。
 * @returns onFormSubmit - フォーム送信関数。
 * @returns errors - フォームのエラー。
 * @returns register - フォームの登録関数。
 * @returns isPending - ミューテーションが保留中かどうか。
 * @returns folders - フォルダのリスト。
 * @returns workspaces - ワークスペースのリスト。
 * @returns isFetching - データ取得中かどうか。
 * @returns isFolders - フォルダのデータ。
 */
export const useMoveVideos = (videoId: string, currentWorkspace: string) => {
  // Reduxストアからフォルダとワークスペースの情報を取得
  const { folders } = useAppSelector((state) => state.FolderReducer);
  const { workspaces } = useAppSelector((state) => state.WorkspacesReducer);

  // データ取得中かどうかを示す状態変数
  const [isFetching, setIsFetching] = useState(false);
  // 取得したフォルダのリストを保持する状態変数
  const [isFolders, setIsFolders] = useState<
    | ({
        _count: {
          videos: number;
        };
      } & {
        id: string;
        name: string;
        createdAt: Date;
        workSpaceId: string | null;
      })[]
    | undefined
  >(undefined);

  // 動画の場所を更新するためのミューテーションフック
  const { mutate, isPending } = useMutationData(
    ["change-video-location"],
    (data: { folder_id: string; workspace_id: string }) =>
      moveVideoLocation(videoId, data.workspace_id, data.folder_id)
  );

  // フォームのバリデーションと送信を処理するフック
  const { errors, onFormSubmit, register, watch } = useZodForm(
    moveVideoSchema,
    mutate,
    { folder_id: null, workspace_id: currentWorkspace }
  );

  // ワークスペースのフォルダを取得する関数
  const fetchFolders = async (workSpace: string) => {
    setIsFetching(true);
    const folders = await getWorkspaceFolders(workSpace);
    setIsFetching(false);
    setIsFolders(folders.data);
  };

  // 初回レンダリング時にフォルダを取得
  useEffect(() => {
    fetchFolders(currentWorkspace);
  }, []);

  // ワークスペースIDが変更されたときにフォルダを再取得
  useEffect(() => {
    const workspace = watch(async (value) => {
      if (value.workspace_id) fetchFolders(value.workspace_id);
    });

    return () => workspace.unsubscribe();
  }, [watch]);

  return {
    onFormSubmit,
    errors,
    register,
    isPending,
    folders,
    workspaces,
    isFetching,
    isFolders,
  };
};
