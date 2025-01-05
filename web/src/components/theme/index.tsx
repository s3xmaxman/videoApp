"use client";

import {
  ThemeProvider as NextThemeProvider,
  ThemeProviderProps,
} from "next-themes";

import { useEffect, useState } from "react";

/**
 * next-themes のためのテーマコンテキストを提供します。これは、コンポーネントがマウントされるまでレンダリングを遅延させる
 * `next-themes` の `ThemeProvider` のラッパーです。
 * これは、`next-themes` が提供する `useTheme` フックがサーバー上で使用されるとエラーをスローするため、
 * コンポーネントがクライアントまたはサーバーのどちらでレンダリングされているかを気にせずに `useTheme` を使用できるようにするために必要です。
 *
 * @param {ReactNode} children - テーマコンテキスト内でレンダリングする子要素。
 * @param {ThemeProviderProps} props - `next-themes` の `ThemeProvider` に渡すプロパティ。
 * @returns {ReactElement} テーマコンテキストでラップされたレンダリングされた子要素。
 */
export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return (
    mounted && <NextThemeProvider {...props}>{children}</NextThemeProvider>
  );
};
