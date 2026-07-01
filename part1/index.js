import {ChatGroq} from "@langchain/groq";
import {ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import { HumanMessage, SystemMessage,AIMessage } from "@langchain/core/messages";
import * as z from "zod";

dotenv.config();


const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
});


//Prompt Template Example
// const PromptTemp = PromptTemplate.fromTemplate("You Are an {domain}.Explain {query} in simple terms.like {domain}");

// const prompt = await PromptTemp.invoke({
//     domain:"Commerece Student",
//     query:"What is C++?"
// });

// Chat prompt Template Example

// const history = [
//     new SystemMessage("You are Narendar Modi So Answer Like ModiJi In Hinglish In Funny Manner."),  
//     new HumanMessage("What is UCC bill?"),
// ];

// const chatPrompt = ChatPromptTemplate.fromMessages([
//     ["system","You are Narendar Modi So Answer Like ModiJi In Hinglish In Funny Manner."],
//     new MessagesPlaceholder("history"),
//     ["human","Explain {query}"]
// ]);

// const prompt = await chatPrompt.invoke({
//     query:"What is full form of that bill?",
//     history
// });


const resultSchema = z.object({
    name:z.string(),
    occupation:z.string(),
    awards:z.array(z.string()),
    country:z.string(),
});

const structuredModel = model.withStructuredOutput(resultSchema);


const prompt = "Who Is Roman Reigns?";

console.log("Prompt:",prompt);

const callGroq = async() => {
    try {
        console.log('Model Called...')
        const result = await structuredModel.invoke(prompt);
        console.log("Groq:",result);
    } catch (error) {
        console.error("Error Occuered:",error);
    }
};

callGroq();