import {tool,createAgent} from "langchain";
import { number } from "zod";
import * as z from "zod";
import dotenv from "dotenv";
// import {createReactAgent } from "langchain/agents";
// import { AgentExecutor } from "langchain/agents";
import * as hub from "langchain/hub";
import {ChatGroq} from "@langchain/groq";

dotenv.config();

const squareTool = tool(
  async({number}) => {
    return number*number;
  },
  {
    name:"square",
    description:"Return Square Of Any Number",
    schema:z.object({
      number:z.number()
    })
  }
);

// const result = await squareTool.invoke({
//   number:25
// });


const jokeTool = tool(
  async() => {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke');
    const result = await res.json();
    return result;
  },
  {
    name:'JokeGenerator',
    description:'Returns Random Joke.'
  }
)

// const result = await jokeTool.invoke();

// console.log(result);

const weatherTool = tool(
  async({city}) => {
    const res = await fetch(`http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`);
    const result = await res.json();
    return result;
  },
  {
    name:'Weather',
    description:'Return Current Weather Info City Given',
    schema:z.object({
      city:z.string()
    })
  }
);
// const result = await weatherTool.invoke({
//   city:'Darbhanga'
// });

// console.log(result);

const model = new ChatGroq({
   model:'openai/gpt-oss-120b',
   apiKey:process.env.GROQ_API_KEY
});

const prompt = `
  Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}
`;

const Agent = createAgent({
  model,
  tools:[weatherTool,jokeTool],
  prompt
}
);

const result = await Agent.invoke({
    messages: [
    {
      role: "user",
      content: "What's the weather in Darbhanga? then tell me a random joke",
    },
  ],
});

console.log(result);


console.log('****************************');
console.log('\n\n\n');

console.log(result.messages[result.messages.length - 1].content);