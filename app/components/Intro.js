"use client";

import { useEffect, useState } from "react";

export default function Intro({ onFinish }) {
  const [stage, setStage] = useState(0);
  // stage 0: "RecoverAI" wordmark fades in
  // stage 1: tagline fades in
  // stage 2: fade whole thing out, then unmount

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 450);
    const t2 = setTimeout(() => setStage(2), 1500);
    const t3 = setTimeout(() => onFinish?.(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div className={`intro-screen ${stage === 2 ? "intro-out" : ""}`}>
      <div className="intro-word">
        Revive<span>Pay</span>
      </div>
      <div className={`intro-tagline ${stage >= 1 ? "show" : ""}`}>
        Autonomous revenue recovery for modern merchants.
      </div>
    </div>
  );
}
