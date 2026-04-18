"use client";

import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/types/type";
import { useEffect, useRef, useState, useTransition, FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Home = () => {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, isPending]);

  async function runSearch(prompt: string) {
    startTransition(async () => {
      setChat((prev) => [
        ...prev,
        { role: "user", searchResponse: { content: prompt } },
      ]);

      const oldTime = performance.now();

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/search`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: prompt }),
          }
        );

        const json = await res.json();
        const timeDiff = Math.round(performance.now() - oldTime);

        if (!res.ok) {
          const msg = "Request failed";

          setChat((prev) => [
            ...prev,
            {
              role: "assistant",
              searchResponse: {
                content: "",
                sources: [],
                error: json.error ?? msg,
                time: timeDiff,
              },
            },
          ]);
        } else {
          setChat((prev) => [
            ...prev,
            {
              role: "assistant",
              searchResponse: {
                content: json.answer,
                sources: json.sources,
                time: timeDiff,
              },
            },
          ]);
        }
      } catch (error) {
        const timeDiff = Math.round(performance.now() - oldTime);

        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            searchResponse: {
              content: "",
              sources: [],
              error: "Request failed",
              time: timeDiff,
            },
          },
        ]);
      }
    });
  }

  async function handleChatSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const prompt = query.trim();

    if (!prompt || isPending) return;

    setQuery("");

    void runSearch(prompt);
  }

  return (
    <div className="flex h-dvh flex-col bg-[#f9fafb] text-gray-900">
      <header className="border-b bg-white px-4 py-3 text-sm flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-medium text-gray-800">Summary RAG Agent</h1>
          <p className="text-[12px] text-gray-500">
            Some answers will browse the web and some do not.
          </p>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {chat.length === 0 && (
          <div className="mx-auto max-w-2xl text-center space-y-2">
            <h1 className="text-sm text-gray-500">
              Start a new conversation by asking a question.
            </h1>
            <p className="text-sm text-gray-400">
              Ask about recent news, facts, or anything else.
            </p>
          </div>
        )}

        {chat.map((turn, idx) => {
          const { content, sources, error, time } = turn.searchResponse;

          if (turn.role === "user") {
            return (
              <div key={idx} className="mx-auto max-w-2xl flex justify-end">
                <div className="inline-block rounded-2xl bg-gray-900 px-4 py-3 text-sm text-white shadow-md max-w-full">
                  <div className="whitespace-pre-wrap break-words">
                    {content}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="mx-auto max-w-2xl flex gap-3">
              <div className="flex size-8 flex-none items-center justify-center rounded-md bg-gray-800 text-[11px] text-white font-semibold">
                AI
              </div>

              <div className="flex-1 space-y-3">
                <div className="inline-block rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-100 w-full">
                  <div className="whitespace-pre-wrap break-words">
                    {content}
                  </div>

                  {(time || error) && (
                    <div className="mt-2 text-[11px] text-gray-500 flex flex-wrap gap-x-3">
                      {typeof time === "number" && (
                        <p>Answered in {time} ms</p>
                      )}

                      {error && (
                        <p className="text-red-500">
                          Error: {error}
                        </p>
                      )}
                    </div>
                  )}

                  {sources && sources.length > 0 && (
                    <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-[12px] ring-1 ring-gray-200">
                      <h2 className="text-[11px] font-medium text-gray-600 mb-1">
                        Sources
                      </h2>

                      <ul className="space-y-1">
                        {sources.map((src, i) => (
                          <li key={i} className="truncate">
                            <Link
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {src}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isPending && (
          <div className="mx-auto max-w-2xl flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-md bg-gray-700 text-white">
              ...
            </div>
            <p className="text-sm text-gray-500">Thinking...</p>
          </div>
        )}

        <footer className="pt-4">
          <form
            className="mx-auto flex w-full max-w-2xl items-end gap-2"
            onSubmit={handleChatSubmit}
          >
            <div className="flex-1">
              <Input
                className="w-full"
                placeholder="Ask your query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isPending}
              />
            </div>

            <Button
              disabled={isPending || query.trim().length < 1}
              type="submit"
            >
              {isPending ? <Spinner /> : "Send"}
            </Button>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default Home;