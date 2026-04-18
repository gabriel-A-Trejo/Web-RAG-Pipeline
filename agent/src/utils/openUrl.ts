import {convert} from "html-to-text"
import { text } from "stream/consumers"
import { OpenUrlOutputSchema } from "./schemas"


export async function openUrl(url: string)
{
    //step 1 - validate url
    const normalized = validateUrl(url)

    //Step 2 fetch the page by myself

    const res = await fetch(normalized, {
        headers: {
            "User-Agent": "agent-core/1.0"
        }
    }
    )

    if(!res.ok)
    {
        const body = await safeBody(res)
        throw new Error(`OpenURL error ${res.status}: ${body.slice(0,50)}`)
    }

    const contentType = res.headers.get("content-type") ?? ""
    const raw = await res.text()

    const text = contentType.includes("text/html") ? convert(raw, {
        wordwrap: false,
        selectors: [{
            selector: 'nav', format: "skip",

        }, {
            selector: 'header', format: "skip",
        }, 
    {
        selector: "script", format: "skip"
    }, 
{
    selector: "style", format: "skip"
}]
    })
    : raw
 

const cleanup = collapseWhitesSpace(text)
const capped = cleanup.slice(0, 8000)

return OpenUrlOutputSchema.parse({
    url: normalized,
    content: capped
})
}


//Step 1 - validate url
function validateUrl(url: string)
{
    try 
    {
        const parsed = new URL(url);
        //https 
        if(!/^https?:$/.test(parsed.protocol))
        {
            throw new Error("Only http and https protocols are allowed")
        }

        return parsed.toString();

    }catch
    {
        throw new Error("Invalid URL")
    }
}


async function safeBody(response: Response) {
    try {
        return await response.text()
    } catch {
        return "<no body>"
    }
}

function collapseWhitesSpace(str: string)
{
    return str.replace(/\s+/g, " ").trim()
}