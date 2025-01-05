import { useState } from "react";
import axios from "axios";
/**
 * サブスクリプション処理用のカスタムフック
 * @returns {Object} サブスクリプション関連の関数と状態
 * @property {Function} onSubscribe - サブスクリプション処理を開始する関数
 * @property {boolean} isProcessing - 処理中かどうかの状態
 *
 * @description
 * このフックは以下の機能を提供します：
 * 1. サブスクリプション処理の状態管理
 * 2. 支払いAPIへのリクエスト処理
 * 3. Stripeのチェックアウトページへのリダイレクト
 * 4. エラーハンドリングとログ出力
 */
export const useSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * サブスクリプション処理を開始する関数
   * @async
   * @returns {Promise<void>}
   * @description
   * 1. 処理中状態をtrueに設定
   * 2. 支払いAPIにGETリクエストを送信
   * 3. レスポンスが正常（status 200）の場合、Stripeのチェックアウトページにリダイレクト
   * 4. エラーが発生した場合、コンソールにエラーを出力
   * 5. 処理終了時に処理中状態をfalseに設定
   */
  const onSubscribe = async () => {
    setIsProcessing(true);

    try {
      const response = await axios.get("/api/payment");

      if (response.data.status === 200) {
        return (window.location.href = `${response.data.session_url}`);
      }

      setIsProcessing(false);
    } catch (error) {
      console.log(error, "🔴");
    }
  };

  return { onSubscribe, isProcessing };
};
