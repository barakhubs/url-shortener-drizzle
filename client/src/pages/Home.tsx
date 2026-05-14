import { useState } from "react";
import { UrlForm } from "../components/UrlForm";
import { ResultCard } from "../components/ResultCard";
import type { ShortenResponse } from "../api";

export function Home() {
  const [result, setResult] = useState<ShortenResponse | null>(null);

  return (
    <main className="home">
      <section className="home__hero">
        <h1 className="home__title">Shorten your link</h1>
        <p className="home__subtitle">
          Paste a long URL and get a short, shareable link instantly.
        </p>
      </section>

      <section className="home__form-section">
        <UrlForm onSuccess={setResult} />
        {result && <ResultCard result={result} />}
      </section>
    </main>
  );
}
