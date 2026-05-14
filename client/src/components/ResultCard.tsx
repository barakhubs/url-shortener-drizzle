import { useState } from "react";
import { Link } from "react-router-dom";
import type { ShortenResponse } from "../api";

interface Props {
  result: ShortenResponse;
}

export function ResultCard({ result }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="result-card">
      <p className="result-card__label">Your short link</p>
      <div className="result-card__row">
        <a
          href={result.shortUrl}
          className="result-card__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {result.shortUrl}
        </a>
        <button
          className="result-card__copy"
          onClick={handleCopy}
          aria-label="Copy short URL to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <p className="result-card__original" title={result.originalUrl}>
        ↳ {result.originalUrl}
      </p>
      <Link
        className="result-card__stats-link"
        to={`/stats/${result.shortCode}`}
      >
        View stats →
      </Link>
    </div>
  );
}
