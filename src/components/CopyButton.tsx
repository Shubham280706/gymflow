"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy pay link" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-quiet btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          window.prompt("Copy this link", text);
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
