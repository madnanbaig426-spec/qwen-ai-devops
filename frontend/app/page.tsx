"use client";

import { FormEvent, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();

    if (!prompt.trim() || loading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: prompt,
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI server");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect to the AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
        <header className="border-b border-gray-800 px-6 py-5">
          <h1 className="text-2xl font-bold">Qwen AI Assistant</h1>
          <p className="mt-1 text-sm text-gray-400">
            Powered by Qwen3.5-0.8B
          </p>
        </header>

        <section className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-semibold">
                  How can I help you?
                </h2>
                <p className="mt-3 text-gray-400">
                  Ask anything and Qwen will generate a response.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-blue-600"
                    : "bg-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-gray-800 px-4 py-3 text-gray-400">
                Qwen is thinking...
              </div>
            </div>
          )}
        </section>

        <form
          onSubmit={sendMessage}
          className="border-t border-gray-800 p-4"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Message Qwen..."
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
