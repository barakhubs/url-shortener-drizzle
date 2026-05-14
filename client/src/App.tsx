import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Home } from "./pages/Home";
import { Stats } from "./pages/Stats";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app">
          <header className="app__header">
            <a href="/" className="app__logo">
              ✂ snip.ly
            </a>
          </header>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stats/:code" element={<Stats />} />
            {/* Catch-all — redirect unmatched client routes back to home */}
            <Route path="*" element={<Home />} />
          </Routes>

          <footer className="app__footer">
            <p>Built with Fastify, Bun, Drizzle ORM &amp; React</p>
          </footer>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
