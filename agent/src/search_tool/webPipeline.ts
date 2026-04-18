import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { candidate, mode } from "./types";
import { webSearch } from "../utils/webSearch";
import { openUrl } from "../utils/openUrl";
import { Summarize } from "../utils/summarize";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";



const SETTOPRESULT = 5;


export const webSearchStep = RunnableLambda.from(
    async (input: {q: string, mode: mode}) =>
    {
        const result = await webSearch(input.q)

        return {
            ...input,
            result
        }
    }
)


export const openAndSummarizeStep = RunnableLambda.from(
    async(input: {q: string, mode: mode, result: any[]}) =>
    {
        if(!Array.isArray(input.result) || input.result.length === 0)
        {
            return {
                ...input,
                pageSummaries: [],
                fallback: "no-result" as const
            }
        }

        const extractTopResults = input.result.slice(0, SETTOPRESULT); 

        const settledResults = await Promise.allSettled(
            extractTopResults.map(async (result: any) => {
                const opened = await openUrl(result.url)
                const summarizeContent = await Summarize(opened.content)

                return {
                    url: opened.url,
                    summary: summarizeContent.summary
                }
            })


        )
                    const settledResultPageSummarize = settledResults.filter(settledResult => settledResult.status === "fulfilled").map(s => s.value)

                    let fallbackSnippetSummarize = settledResultPageSummarize;

                    if(settledResultPageSummarize.length === 0)
                    {
                        fallbackSnippetSummarize = extractTopResults.map((result: any) =>
                        ({
                            url: result.url,
                            summary: (result.snippet || result.title || "").trim()
                        })).filter((x: any) => x.summary.length > 0)
                    }

                    return {
                        ...input,
                        pageSummaries: fallbackSnippetSummarize,
                        fallback: "none" as const
                    }

    })


     export const composeStep = RunnableLambda.from(
        async (input: {q: string, pageSummaries: Array<{url: string, summary: string}>; mode: mode, fallback: "no-result" | "snippets" | "none"}): Promise<candidate>  =>
        {
            const model = getChatModel({temperature: 0.2})

            if(!input.pageSummaries || input.pageSummaries.length === 0)
            {
                const directResponseModel =  await model.invoke(
                    [ 
                        new SystemMessage([
                            "You answer briefly and clearly for beginners",
                            "If unsure say so"
                        ].join("\n")),
                        new HumanMessage(input.q)
                    ]
                )

                const directAns = typeof directResponseModel.content === "string" ? directResponseModel.content : String(directResponseModel.content).trim()

                return {
                    answer: directAns,
                    sources: [],
                    mode: "direct"
                }
            }

            const res = await model.invoke(
                [
                    new SystemMessage([
                        "You concisely answer questions using provided page summaries.",
                        "RULE:", 
                        "- Be accurate and nuetral",
                        "- 5-8 sentences max",
                        "- Use only the provided summaries; do not invent new facts"
                ].join("\n")),

            new HumanMessage(
                [
                    `Question: ${input.q}`,
                    "Summaries:",
                    JSON.stringify(input.pageSummaries, null, 2)
                ].join("\n"))
            ]
        )

        const finalAns =  typeof res.content === "string" ? res.content : String(res.content)
        const extractSources = input.pageSummaries.map(x=>x.url)
        return {
            answer: finalAns,
            sources: extractSources,
            mode: "web"
        }
        }
    )
    
    //LCEL 
    //WebSearchStep
    //OpenAnd SUmarizeStep 
    //StepCompose


    export const webBasedPath = RunnableSequence.from(
        [
            webSearchStep,
            openAndSummarizeStep,
            composeStep
        ]
    )