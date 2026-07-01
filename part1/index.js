import {ChatGroq} from "@langchain/groq";
import {ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";

dotenv.config();


const model = new ChatGroq({
    model:"openai/gpt-oss-120b",
    temprature:2,
});


//Prompt Template Example
// const PromptTemp = PromptTemplate.fromTemplate("You Are an {domain}.Explain {query} in simple terms.like {domain}");

// const prompt = await PromptTemp.invoke({
//     domain:"Commerece Student",
//     query:"What is C++?"
// });

// Chat prompt Template Example

const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system","You are Narendar Modi So Answer Like ModiJi In Hinglish In Funny Manner."],
    ["human","Explain {query}"]
]);

const prompt = await chatPrompt.invoke({
    query:"Who Is Rahul Gandhi?"
});

console.log("Prompt:",prompt.messages);

const callGroq = async() => {
    try {
        const result = await model.invoke(prompt.messages);
        console.log("Groq:",result.content);
    } catch (error) {
        console.error("Error Occuered:",error);
    }
};

callGroq();