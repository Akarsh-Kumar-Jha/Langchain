import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import supabase from "./supabaseClient.js";

export const loader = async (filePath) => {
    
const { data, error } = await supabase.storage
  .from("Resumes")
  .download(filePath);

  console.log('PDF LOADED FROM SUPABASE ------> ',data);

  if (error) throw error;

const loader = new PDFLoader(data);
const pdfDoc = await loader.load();
console.log("Pdf Loaded = ", pdfDoc);
return pdfDoc;
};


//   const { data, error } = await supabase
//   .storage
//   .from('avatars')
//   .download('folder/avatar1.png')