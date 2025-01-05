/**
 * VoiceFlowチャットボットをロードする関数
 */
export const loadVoiceFlowAgent = () => {
  // スクリプト要素を作成してVoiceFlowウィジェットをロード
  const loadVoiceFlowWidget = (document, scriptTag) => {
    const voiceFlowScript = document.createElement(scriptTag);
    const firstScript = document.getElementsByTagName(scriptTag)[0];

    voiceFlowScript.onload = () => {
      window.voiceflow.chat.load({
        verify: { projectID: process.env.NEXT_PUBLIC_VOICE_FLOW_KEY },
        url: "https://general-runtime.voiceflow.com",
        versionID: "production",
      });
    };

    voiceFlowScript.src = "https://cdn.voiceflow.com/widget/bundle.mjs";
    voiceFlowScript.type = "text/javascript";
    firstScript.parentNode.insertBefore(voiceFlowScript, firstScript);
  };

  loadVoiceFlowWidget(document, "script");
};
