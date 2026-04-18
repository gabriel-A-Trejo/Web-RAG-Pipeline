import { RunnableLambda } from "@langchain/core/runnables";
import { candidate } from "./types";
import { SearchAnswerSchema } from "../utils/schemas";
import { getChatModel } from "../shared/models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export const finalValidateAndPolish = RunnableLambda.from(
    async (candidate: candidate): Promise<Pick<candidate, "answer" | "sources">> => {
        const FinalDraft = {
            answer : candidate.answer,
            sources: candidate.sources ?? []
        }

        const parsedAnswer = SearchAnswerSchema.safeParse(FinalDraft)

        if(parsedAnswer.success) return parsedAnswer.data

   
        const repaired = await repairSearchAnswer(FinalDraft)
        const parsedAnswer2 =  SearchAnswerSchema.safeParse(repaired)
        if(parsedAnswer2.success) return parsedAnswer2.data
        
        return repaired
    } 
)

async function repairSearchAnswer(obj: any): Promise<Pick<candidate, "answer" | "sources">>
{
    const model = getChatModel({temperature: 0.2})

    const res = await model.invoke([
        new SystemMessage([
            "You fix json object to match a given schema",
            "Respond only with valid json object",
            "Schema: {answer: string, sources: string[] (url as strings)}"
        ].join("\n")),
        new HumanMessage([
            "Make this exactly to the the schema. Ensure sources is an array of URL strings",
            "Input JSON: ",
            JSON.stringify(obj)
        ].join("\n\n"))
    ])

    const text = typeof res.content === "string" ? res.content : String(res.content)

    const json = extractJson(text)

    return {
        answer: String(json.answer ?? "").trim(),
        sources: Array.isArray(json?.sources) ? json.sources.map(String) : []
    }
}

function extractJson(input: string) {
    const start = input.indexOf("{");
    const end = input.lastIndexOf("}");

    if (start === -1 || end === -1 || start >= end) {
        return {}
    } 

    try{
        return JSON.parse(input.slice(start, end + 1))
    } catch {
        return {}
    }
}