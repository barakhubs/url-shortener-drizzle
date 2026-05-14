import { useState, type FormEvent } from "react";
import { shortenUrl, type ShortenResponse } from "../api";

interface Props {
  onSuccess: (result: ShortenResponse) => void;
}

export function UrlForm({ onSuccess }: Props) {
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await shortenUrl(inputUrl.trim());
      onSuccess(result);
      setInputUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to shorten URL.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="url-form" onSubmit={handleSubmit}>
      <div className="url-form__row">
        <input
          type="url"
          className="url-form__input"
          placeholder="https://example.com/your-long-url"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          required
          maxLength={2048}
          disabled={loading}
          aria-label="URL to shorten"
        />
        <button
          type="submit"
          className="url-form__button"
          disabled={loading || !inputUrl.trim()}
        >
          {loading ? "Shortening…" : "Shorten"}
        </button>
      </div>
      {error && (
        <p className="url-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
