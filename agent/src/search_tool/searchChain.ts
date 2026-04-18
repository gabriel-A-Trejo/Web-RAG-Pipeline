import { RunnableBranch, RunnableSequence } from "@langchain/core/runnables";
import { mode } from "./types";
import { webBasedPath } from "./webPipeline";
import { directPath } from "./directPipeline";
import { routerStep } from "./routeStrategy";
import { finalValidateAndPolish } from "./finalValidate";
import { SearchInput } from "../utils/schemas";

const branch = RunnableBranch.from<{q: string, mode: mode}, any>(
    [
        [(input) => input.mode === "web", webBasedPath],
        directPath
    ]
)

export const searchChain = RunnableSequence.from([
    routerStep,
    branch,
    finalValidateAndPolish
])


export async function runSearch(input:SearchInput) {
    return await searchChain.invoke(input)
}