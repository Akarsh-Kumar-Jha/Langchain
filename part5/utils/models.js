import {ChatGroq} from "@langchain/groq";
import {ChatOpenRouter} from "@langchain/openrouter";
import dotenv from "dotenv";
dotenv.config({
    path:'.env'
});


export const Groqmodel = new ChatGroq({
    model:'openai/gpt-oss-120b',
    apiKey:process.env.GROQ_API_KEY
});

export const OpenRouterModel = new ChatOpenRouter({
    model:'nvidia/nemotron-nano-9b-v2:free',
    apiKey:process.env.OPENROUTER_API_KEY
});



