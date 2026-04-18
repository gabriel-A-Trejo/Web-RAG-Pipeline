

import {env} from "../shared/env"
import { WebSearchResultSchema, webSearchResultSchema } from "./schemas"

export async function webSearch(q: string) {
    const query = (q ?? "").trim()
    if (!query) return []

    return searchTavilyUtil(query)
}

async function searchTavilyUtil(query: string) {
    if (!env.TAVILY_API_KEY) {
        throw new Error("Tavily API key is not set")
    }

    const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${env.TAVILY_API_KEY}`
        },
        body: JSON.stringify({
            query,
            search_depth: "basic",
            max_results: 5,
            includes_answer: false,
            includes_images: false
        })
    })

    if (!response.ok) {
        const error = await safeBody(response)
        throw new Error(`Tavily error ${response.status}: ${error}`)
    }

    const data = await response.json()

    const results = Array.isArray(data?.results) ? data.results : []

    return webSearchResultSchema.parse(
        results.map((r: unknown) =>
            WebSearchResultSchema.parse({
                title: String((r as any)?.title ?? "").trim() || "Untitled",
                url: String((r as any)?.url ?? "").trim(),
                snippet: String((r as any)?.content ?? "")
                    .trim()
                    .slice(0, 220)
            })
        )
    )
}

async function safeBody(response: Response) {
    try {
        return await response.text()
    } catch {
        return "<no body>"
    }
}