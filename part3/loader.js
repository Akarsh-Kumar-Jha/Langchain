import { PromptTemplate } from "@langchain/core/prompts";
import {ChatGroq} from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import dotenv from "dotenv";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";


dotenv.config();

const model = new ChatGroq({
    model:'openai/gpt-oss-120b'
});


const template = PromptTemplate.fromTemplate(
    "You are AI Chatbot Akarsh Jha.Your Task Is To  Answer The Question In English To The User Asking about Akarsh. query:{query} according to this \n doc:{doc}"
);
const parser = new StringOutputParser();

const loader = new TextLoader("akarsh.txt");

const docs = await loader.load();


const spliter = new RecursiveCharacterTextSplitter({
    chunkSize:200,
    chunkOverlap:100
});

const spilttedDocs = await spliter.splitDocuments(docs);



console.log('spilttedDocs -->',spilttedDocs);

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2"
});


const vectorStore = new MemoryVectorStore(embeddings);

await vectorStore.addDocuments(spilttedDocs);


const retriever = vectorStore.asRetriever({
    k:2
});


// const results = await vectorStore.similaritySearch("Akarsh Kumar ", 2);


const results = await retriever.invoke('Akarsh Kumar');

console.log('Retreived From Vector Store :',results);


const chain = template.pipe(model).pipe(parser);

const callModel = async() => {
    const result = await chain.invoke({
        query:'Does He Have any Finances?',
        doc:docs[0].pageContent
    });

    console.log("Response :",result);
};

// callModel();