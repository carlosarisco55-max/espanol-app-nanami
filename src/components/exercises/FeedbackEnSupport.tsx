"use client";

import { useEffect, useId, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readFeedbackEnPref, writeFeedbackEnPref } from "@/lib/feedback-en";
import styles from "./exercises.module.css";

export default function FeedbackEnSupport({ text }: { text: string }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(readFeedbackEnPref());
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    writeFeedbackEnPref(next);
  }

  return (
    <div className={styles.feedbackEn}>
      <button
        type="button"
        className={styles.feedbackEnToggle}
        onClick={toggle}
        aria-pressed={open}
        aria-expanded={open}
        aria-controls={panelId}
      >
        🌐 {open ? "Hide English" : "English"}
      </button>
      {open && (
        <div id={panelId} className={styles.feedbackEnBody} lang="en">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
