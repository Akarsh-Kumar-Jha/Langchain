import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import { loader } from "./loader.js";
import { splitter } from "./splitter.js";
import { retriever as createEmbeddings } from "./embeddings.js";

// dotenv.config({
//     path:'../.env'
// });

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const embeddingsWorker = new Worker(
  "embeddingsQueue",
  async (job) => {
    console.log("**************New Task Recieved In Worker***************");
    console.log("JOB = ", job.data);
    const pdfDoc = await loader(job.data.filePath);
    pdfDoc.forEach((doc) => {
      doc.metadata.uid = job.data.user.id;
    });
    await createEmbeddings(pdfDoc);
  },
  {
    connection,
  },
);

embeddingsWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

embeddingsWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed`, err);
});

console.log("Worker Started✅");
