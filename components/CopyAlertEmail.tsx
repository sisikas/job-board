"use client";

import { useState } from "react";

type Props = {
  subject: string;
  html: string;
  text: string;
  showSubject?: boolean;
};

export function CopyAlertEmail({ subject, html, text, showSubject = true }: Props) {
  const [notice, setNotice] = useState("");

  async function copySubject() {
    await navigator.clipboard.writeText(subject);
    setNotice("Subject copied. Paste it into Gmail’s subject line.");
  }

  async function copyForGmail() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      setNotice("Message copied. In Gmail, click the message body and paste.");
    } catch {
      setNotice("Select the message below, copy it, and paste it into Gmail’s message body.");
    }
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {showSubject && (
        <button
          type="button"
          onClick={copySubject}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
        >
          Copy subject
        </button>
      )}
      <button
        type="button"
        onClick={copyForGmail}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        Copy for Gmail
      </button>
      {notice && <p className="w-full text-sm text-neutral-600">{notice}</p>}
    </div>
  );
}
