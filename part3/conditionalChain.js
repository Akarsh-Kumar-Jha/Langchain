import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import * as z from "zod";
import dotenv from "dotenv";
import { RunnableBranch, RunnableLambda, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

dotenv.config();

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

const classifierSchema = z.object({
  sentiment: z.enum(["positive", "Negative"]),
});

const structuredClassifierModel = model.withStructuredOutput(classifierSchema);
const parser = new StringOutputParser();

const classifierTemplate = PromptTemplate.fromTemplate(
  "Classify The Following Review.\n\n {review}",
);

const ClassifierChain = classifierTemplate.pipe(structuredClassifierModel);


const positiveTemplate = PromptTemplate.fromTemplate("Write an Postive Response To The Customer According To This Review.\n\n {review}");
const negativeTemplate = PromptTemplate.fromTemplate("Write an Negative Response To The Customer According To This Review.\n\n {review}");

const PostiveChain = positiveTemplate.pipe(model);
const NegativeChain = negativeTemplate.pipe(model);


// const OptionalChain = RunnableBranch.from([ 
//     [(sentiment) => sentiment.sentiment === 'positive',PostiveChain],
//     [(sentiment) => sentiment.sentiment === 'Negative',NegativeChain],
//     RunnableLambda.from((x) => "Unknown sentiment")
// ]
// );


const chain = RunnablePassthrough.assign({
  classification: ClassifierChain,
})
.pipe(
  RunnableBranch.from([
    [
      (x) => x.classification.sentiment === "positive",
      positiveTemplate.pipe(model),
    ],
    [
      (x) => x.classification.sentiment === "Negative",
      negativeTemplate.pipe(model),
    ],
    RunnableLambda.from(() => "Unknown sentiment"),
  ])
)
.pipe(parser);

const callModel = async() => {
try {
        const result = await chain.invoke({
      review:
        "This was a complete disappointment. The product arrived damaged, stopped working after two days, and the customer service team never responded to my emails. I regret buying it.",
    });
    
    console.log('Response :',result);
} catch (error) {
    console.error('Error Occuered:',error);
}
};

callModel();
