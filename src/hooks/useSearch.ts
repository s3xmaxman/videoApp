import { useEffect, useState } from "react";

import { searchUsers } from "@/actions/user";
import { useQueryData } from "./useQueryData";

/**
 * 検索機能を提供するカスタムフック。
 *
 * @param key - クエリキーの一部として使用される文字列。
 * @param type - 検索対象のタイプ。"USERS" のみがサポートされています。
 * @returns onSearchQuery - 検索クエリを更新するための関数。
 * @returns query - 現在の検索クエリ。
 * @returns isFetching - データ取得中かどうかを示すブール値。
 * @returns onUsers - 検索結果として返されたユーザーの配列。
 */
export const useSearch = (key: string, type: "USERS") => {
  const [query, setQuery] = useState("");
  const [debounce, setDebounce] = useState("");
  const [onUsers, setOnUsers] = useState<
    | {
        id: string;
        subscription: {
          plan: "PRO" | "FREE";
        } | null;
        firstname: string | null;
        lastname: string | null;
        image: string | null;
        email: string | null;
      }[]
    | undefined
  >(undefined);

  /**
   * 検索クエリを更新するイベントハンドラ。
   * @param e - イベントオブジェクト。
   */
  const onSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // クエリが変更されたときにdebounceを設定
  useEffect(() => {
    const delayInputTimeoutId = setTimeout(() => {
      setDebounce(query);
    }, 1000);
    return () => clearTimeout(delayInputTimeoutId);
  }, [query]);

  // useQueryDataフックを使用してデータを取得
  const { refetch, isFetching } = useQueryData(
    [key, debounce],
    async ({ queryKey }) => {
      if (type === "USERS") {
        const users = await searchUsers(queryKey[1] as string);

        if (users.status === 200) {
          setOnUsers(users.data);
        }
      }
    },
    false
  );

  // debounceが変更されたときにrefetchを実行
  useEffect(() => {
    if (debounce) refetch();
    if (!debounce) setOnUsers(undefined);
    return () => {};
  }, [debounce]);

  return { onSearchQuery, query, isFetching, onUsers };
};
