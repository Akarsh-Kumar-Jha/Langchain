import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";


  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-2",
  });


const emb = await embeddings.embedQuery("hello world");

console.log("Embedding length =", emb.length);

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: process.env.QDRANT_URL,
  apiKey:process.env.QDARNT_API_KEY,
  collectionName: "Resumes",
});

console.log('Vector Store Created✅',vectorStore);

export default vectorStore;
