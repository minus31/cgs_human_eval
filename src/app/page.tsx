"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      const data = await res.json();
      localStorage.setItem(`session:${data.sessionId}`, JSON.stringify(data));
      router.push(`/session/${data.sessionId}/task/1`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 w-full max-w-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Passage Ranking Study</h1>
          <p className="mt-2 text-sm text-gray-600">
            You will complete 15 ranking tasks. Each task asks you to order 5 passages for a
            given query using the provided explanation.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
          <strong>Instructions:</strong>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Read the query at the top of each task.</li>
            <li>Use the explanation on the left to judge passage relevance.</li>
            <li>Drag passages on the right into order from most to least relevant.</li>
            <li>Submit when ready. You cannot revisit previous tasks.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!isValidEmail || loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Starting…" : "Start Study"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-400 text-center">
          Your email is only used to identify your session.
        </p>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            We report the consent procedure in Appendix Human Evaluation Protocol. Participants
            were informed that their responses would be used for research evaluation of ranking
            explanations before starting the study.
          </p>
        </div>
      </div>
    </main>
  );
}
