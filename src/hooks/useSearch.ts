import { useEffect, useState } from "react";
import { useQueryData } from "./useQueryData";
import { searchWorkSpace } from "@/actions/user";

export const useSearch = (key: string, type: "WORKSPACE") => {
  const [query, setQuery] = useState("");
  const [debounce, setDeboune] = useState("");
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

  const onSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    const delayInputTimeoutId = setTimeout(() => {
      setDeboune(query);
    }, 1000);

    return () => {
      clearTimeout(delayInputTimeoutId);
    };
  }, [query]);

  const { refetch, isFetching } = useQueryData(
    [key, debounce],
    async ({ queryKey }) => {
      if (type === "WORKSPACE") {
        const workspace = await searchWorkSpace(queryKey[1] as string);

        if (workspace.status === 200) {
          setOnUsers(workspace.data);
        }
      }
    },
    false
  );

  useEffect(() => {
    if (debounce) refetch();
    if (!debounce) setOnUsers(undefined);
    return () => {};
  }, [debounce]);

  return { onSearchQuery, query, isFetching, onUsers };
};
