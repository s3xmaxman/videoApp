import {
  Enabled,
  QueryFunction,
  QueryKey,
  useQuery,
} from "@tanstack/react-query";

/**
 * React QueryのuseQueryフックをラップしたカスタムフック。
 * データ取得と状態管理を簡略化します。
 *
 * @param queryKey - クエリキー。データのキャッシュと再取得に使用されます。
 * @param queryFn - データ取得のための非同期関数。
 * @param enabled - クエリを有効にするかどうか（オプション）。
 * @returns data - 取得したデータ。
 * @returns isPending - データ取得が保留中かどうか。
 * @returns isFetched - データが少なくとも一度は取得されたかどうか。
 * @returns refetch - データを再取得するための関数。
 * @returns isFetching - データ取得中かどうか。
 */
export const useQueryData = (
  queryKey: QueryKey,
  queryFn: QueryFunction,
  enabled?: Enabled
) => {
  const { data, isPending, isFetched, refetch, isFetching } = useQuery({
    queryKey,
    queryFn,
  });
  return { data, isPending, isFetched, refetch, isFetching };
};
