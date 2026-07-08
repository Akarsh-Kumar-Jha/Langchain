import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { splitter } from "../utils/splitter.js";
import vectorStore from "./vectorStore.js";

export const retriever = async (pdfDoc) => {
  // const vectorStore = new MemoryVectorStore(embeddings);
  const splittedDocs = await splitter(pdfDoc);
  console.log('Spliting Done ✅');
console.log("Added one document");
  await vectorStore.addDocuments(splittedDocs);
  console.log('Embeddings Created ✅');
};
