"use client";
import React, { useEffect } from "react";
import { loadVoiceFlowAgent } from "@/lib/voiceflow";

const VoiceFlowAgent = () => {
  useEffect(() => {
    loadVoiceFlowAgent();
  }, []);

  return <></>;
};

export default VoiceFlowAgent;
