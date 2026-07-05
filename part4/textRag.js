import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableParallel,RunnablePassthrough,RunnableLambda } from "@langchain/core/runnables";

dotenv.config();

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

const loader = new TextLoader("test.txt");

const txtDoc = await loader.load();

// console.log('Loaded --> ',txtDoc[0].pageContent);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 70,
});

const splittedDocs = await splitter.splitDocuments(txtDoc);

console.log("Splitted Docs ---> ", splittedDocs);

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
});

const vectorStore = new MemoryVectorStore(embeddings);

await vectorStore.addDocuments(splittedDocs);

const retiever = vectorStore.asRetriever({
  k: 2,
});

const parallelChain = RunnableParallel.from({
    question:new RunnablePassthrough(),
    context:RunnableLambda.from((input) => input.question).pipe(retiever).pipe(RunnableLambda.from((input) => {
        return input.map((x) => x.pageContent)
    }))
});


const template = PromptTemplate.fromTemplate(
  `
    You are a QA assistant.

Use ONLY the supplied context.

If the answer is not present in the context,
reply exactly:

"Not Found"

Do not use outside knowledge.

Context:
{context}

Question:
{question}
    `,
);

const chain = parallelChain.pipe(template).pipe(model);

const response = await chain.invoke({
    question:'What is the support email?'
});

console.log('-----------------Response --------------');

console.log(response.content);
