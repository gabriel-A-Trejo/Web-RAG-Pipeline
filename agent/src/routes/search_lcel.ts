import { error } from "console"
import {Router} from "express"
import { SearchInputSchema } from "../utils/schemas"
import { runSearch } from "../search_tool/searchChain"

export const searchRouter = Router()

searchRouter.post("/", async (req, res) =>
{
    try
    {
        const input = SearchInputSchema.parse(req.body)
        const result = await runSearch(input)
        res.status(200).json(result)

    } catch(e)
    {
        const errorMessage = (e as Error)?.message ?? "Unknown error"
        res.status(400).json({ error: errorMessage })
    }
}   )