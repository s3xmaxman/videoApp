import { useState } from "react";
import axios from "axios";

/**
 * サブスクリプション処理を行うカスタムフック
 * @returns {Object} サブスクリプション処理の状態と実行関数を含むオブジェクト
 * @property {boolean} isProcessing - 処理中の状態（true: 処理中, false: 待機中）
 * @property {Function} onSubscribe - サブスクリプション処理を実行する関数
 */
export const useSubscription = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * サブスクリプション処理を実行する関数
   * @async
   * @returns {Promise<void>} 処理結果を返すPromise
   * @description
   * 1. 処理状態をtrueに設定
   * 2. APIエンドポイントにPOSTリクエストを送信
   * 3. レスポンスが成功した場合、指定されたURLにリダイレクト
   * 4. エラーが発生した場合、コンソールにエラーを出力
   * 5. 処理終了後、処理状態をfalseに設定
   */
  const onSubscribe = async () => {
    setIsProcessing(true);

    try {
      const response = await axios.post("/api/payment");

      if (response.data.status === 200) {
        return (window.location.href = `${response.data.session.url}`);
      }

      setIsProcessing(false);
    } catch (error) {
      console.log(error);
    }
  };

  return { isProcessing, onSubscribe };
};
