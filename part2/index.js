import express from "express";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import * as z from "zod";

const app = express();
app.use(express.json());

dotenv.config();

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
});

const resultSchema = z.object({
  problem: z.string(),
  cause: z.array(z.string()),
  solution: z.string(),
  prevention: z.string(),
  treatment: z.array(z.string()),
  diet: z.array(z.string()),
  supplements: z.array(z.string()),
});

const structuredModel = model.withStructuredOutput(resultSchema);

const CallGroq = async (prompt) => {
  try {
    console.log("User Query:", prompt);
    const result = await structuredModel.invoke(prompt);
    console.log("Groq:", result);
    return result;
  } catch (error) {
    console.error("Error Occuered:", error);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is Running Fine!",
  });
});

app.post("/ask", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please Provide a Query!",
      });
    }
    const result = await CallGroq(query);

    return res.status(200).json({
      success: true,
      result: result,
    });
  } catch (err) {
    return res.status(500).json({
        success:false,
        message:"Internal Server Error",
        error:err
    });
  };
});
