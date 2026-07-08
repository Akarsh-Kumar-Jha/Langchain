import { loader } from "../utils/loader.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const splitter = async (pdfDoc) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
  });
  const splittedDocs = await splitter.splitDocuments(pdfDoc);

  console.log("Splitted ==== ", splittedDocs);

  return splittedDocs;
};
