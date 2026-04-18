import { RunnableLambda } from "@langchain/core/runnables";
import { mode, candidate } from "./types";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";



export const directPath = RunnableLambda.from(
    async (input: { q: string; mode: mode }): Promise<candidate> =>
    {
        const model = getChatModel({temperature: 0.2})

        const res = await model.invoke(
            [

                        new SystemMessage([
                            "You answer briefly and clearly for beginners",
                            "If unsure say so"
                        ].join("\n")),
                        new HumanMessage(input.q)
            ]
        )

                const directAns = typeof res.content === "string" ? res.content : String(res.content).trim()

                return {
                    answer: directAns,
                    sources: [],
                    mode: "direct"
                }
    } )
