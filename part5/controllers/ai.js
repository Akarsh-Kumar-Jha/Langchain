import { Groqmodel, OpenRouterModel } from "../utils/models.js";
import {
  RunnableLambda,
  RunnableParallel,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { loader } from "../utils/loader.js";
import * as z from "zod";
import supabase from "../utils/supabaseClient.js";
import vectorStore from "../utils/vectorStore.js";
import IORedis from 'ioredis';
import { tryCatch } from "bullmq";

const redis = new IORedis(process.env.REDIS_URL);

export const chatAI = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Please Provide Query",
      });
    }

    // Create a channel with a descriptive topic name
    const channel = supabase.channel("room:lobby:messages", {
      config: { private: false, broadcast: { self: true } },
    });

    const contextFixer = (input) => {
      let context = "";
      input.forEach((x) => {
        context = context + "\n" + x.pageContent;
      });

      return context;
    };

   const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  k: 4,
  filter: {
    must: [
      {
        key: "metadata.uid",
        match: {
          value: req.user.id,
        },
      },
    ],
  },
});

    const parallelChain = RunnableParallel.from({
      question: new RunnablePassthrough(),
      context: retriever.pipe(RunnableLambda.from(contextFixer)),
    });

    const template = PromptTemplate.fromTemplate(`
You are an AI Resume Assistant.

You have two responsibilities:

1. Answer factual questions using ONLY the resume context.
2. If the user asks for resume advice, ATS suggestions, career guidance, or improvements, use your professional knowledge together with the resume context and try to answer In Short and in textual format but effective.

Rules:
- Never invent facts about the resume.
- Use resume context whenever available.
- Advice may use general recruiting best practices.
- Clearly state when a recommendation is general advice rather than something found in the resume.
- Keep The Answer In Short But Effective

Resume Context:
{context}

Question:
{question}
`);

    // const pOut = await parallelChain.invoke("What Projects?");
    const parser = new StringOutputParser();

    const chain = parallelChain.pipe(template).pipe(Groqmodel).pipe(parser);

    console.log("*******************");
    const result = await chain.invoke(query);

    console.log(result + "\n\n\n\n");
    console.log("__________________________________________________");

    channel
      .on("broadcast", { event: "message_sent" }, (payload) => {
        console.log("Received:", payload.payload);
      })
      .subscribe(async (status) => {
        console.log("STATUS +++++  ", status);
        if (status === "SUBSCRIBED") {
          await channel.send({
            type: "broadcast",
            event: "message_sent",
            payload: { text: "Hello" },
          });
        }
      });

    return res.status(200).json({
      success: true,
      message: "Answer Given Successfully.",
      response: result,
    });

    // console.log("__________-------___________");
    // console.log(pOut);

    //    const response = await Groqmodel.invoke(`
    //     Answer The Given Question By The Context Given To You In a Formal Manner.
    //     If The Answer is Not Found In The Context Given Simply Reply Unable To Find.\n

    //     question:${question} \n\n
    //      context:${context}
    //     `);
  } catch (error) {
    console.error("Error Occuered While Model Calling", error);
    return res.status(500).json({
      success: false,
      message: "Error While Giving Response!",
      error,
    });
  }
};

// chatAI();

export const AI_Analysis = async (req, res) => {
  try {
    const {data,error} = await supabase.from("Users").select("Resume_path").eq('user_id', req.user.id);

    console.log('File Path From Supabase =-=-=- ',data[0].Resume_path);

    if (error || !data[0].Resume_path) {
      return res.status(402).json({
        success: false,
        message: "Please Upload Resume!",
      });
    }
    const resume = await loader(data[0].Resume_path);
    console.log("-------------- Resume -------------");
    console.log('File Loaded From Supabase __== ',resume);
    const outputSchema = z.object({
      ats_score: z.number().min(0).max(100),

      overall_feedback: z.string(),

      strengths: z.array(z.string()),

      weaknesses: z.array(z.string()),

      missing_skills: z.array(z.string()),

      grammar_issues: z.array(
        z.object({
          issue: z.string(),
          suggestion: z.string(),
        }),
      ),

      projects: z.array(
        z.object({
          project_name: z.string(),
          rating: z.number().min(1).max(10),
          feedback: z.string(),
          improvements: z.array(z.string()),
        }),
      ),

      resume_sections: z.object({
        summary: z.string(),
        experience: z.string(),
        education: z.string(),
        projects: z.string(),
        skills: z.string(),
        certifications: z.string(),
      }),

      improvement_suggestions: z.array(z.string()),

      interview_topics: z.array(z.string()),

      resume_rating: z.enum(["Excellent", "Good", "Average", "Poor"]),
    });

    const StructuredModel = Groqmodel.withStructuredOutput(outputSchema);

    const template = PromptTemplate.fromTemplate(`
            You are an expert ATS Resume Reviewer, Technical Recruiter, and Career Coach.

Your task is to thoroughly analyze the given resume.

Evaluate:

1. ATS compatibility
2. Resume formatting
3. Grammar
4. Technical skills
5. Soft skills
6. Work experience
7. Projects
8. Education
9. Resume completeness
10. Current market relevance

Instructions:

• Assign an ATS score between 0 and 100.

• Do NOT invent information.

• Review every project individually.

• Detect grammar and spelling mistakes.

• Mention weak resume sections.

• Mention strong sections.

• Suggest concrete improvements.

• Recommend interview topics based on the technologies used.

• Return ONLY the structured output.

Resume:

{resume}
            `);

    const chain = template.pipe(StructuredModel);

    const result = await chain.invoke({
      resume: resume,
    });
    console.log("Response === ", result);

    const reportExist = await redis.get(`analysis/user-${req.user.id}`);

    if (reportExist) {
      await redis.del(`analysis/user-${req.user.id}`);
    }

    await redis.set(`analysis/user-${req.user.id}`,JSON.stringify(result));
    console.log('Redis Upload✅');

    return res.status(200).json({
      success: true,
      message: "Resume Analyzed Succesfully",
      data: result,
    });
  } catch (error) {
    console.error("Error While Analyzing ;", error);
    return res.status(500).json({
      success: false,
      message: "Error While Analyzing Resume!",
      error,
    });
  }
};

export const getAnalysis = async(req,res) => {
  try{

    const userId = req.user.id;

    const report = await redis.get(`analysis/user-${userId}`);

    if(!report){
      return res.status(400).json({
        success:false,
        message:"Report Not Found!"
      });
    };

    console.log('redis Report = ',JSON.parse(report));

    return res.status(200).json({
      success:true,
      message:'Report Fetched Succesfully.',
      data:JSON.parse(report)
    });

  }catch(error){
    console.error(500).json({
      success:false,
      message:'Error While Getting Analysis Report',
      error
    });
  };
}

export const JD_match = async (req, res) => {
  try {
    const { job_desc } = req.body;
    const {data,error} = await supabase.from("Users").select("Resume_path").eq('user_id', req.user.id);
    if (error || !data[0].Resume_path) {
      return res.status(402).json({
        success: false,
        message: "Please Upload Resume!",
      });
    };


    console.log('Resume Path In JD_MATCH = ',data[0].Resume_path);
    const resume = await loader(data[0].Resume_path);

    if (!job_desc) {
      return res.status(400).json({
        success: false,
        message: "Please provide Job Description!",
      });
    }

    const outputSchema = z.object({
      match_score: z
        .number()
        .min(0)
        .max(100)
        .describe("Overall resume match score (0-100)."),

      performance: z.enum(["Excellent", "Good", "Average", "Poor"]),

      summary: z
        .string()
        .describe(
          "A short 2-3 sentence summary of how well the resume matches the job description.",
        ),

      matching_skills: z
        .array(z.string())
        .describe("Skills found in both the resume and the job description."),

      missing_skills: z
        .array(z.string())
        .describe(
          "Important skills required by the job but missing in the resume.",
        ),

      strong_points: z
        .array(z.string())
        .describe("Candidate's strongest qualifications."),

      improvement_suggestions: z
        .array(z.string())
        .describe("Specific suggestions to improve the resume for this job."),

      experience_match: z
        .string()
        .describe(
          "Whether the candidate's experience aligns with the required experience.",
        ),

      education_match: z
        .string()
        .describe("Whether the education requirements are satisfied."),

      final_verdict: z.enum([
        "Highly Recommended",
        "Recommended",
        "Consider",
        "Not Recommended",
      ]),
    });

    const StrModel = Groqmodel.withStructuredOutput(outputSchema);

    const template = PromptTemplate.fromTemplate(`
You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter.

Your task is to evaluate the candidate's resume against the provided job description.

Carefully compare:

- Technical Skills
- Programming Languages
- Frameworks & Libraries
- Databases
- Tools & Technologies
- Experience
- Education
- Projects
- Certifications (if any)
- Soft Skills

Scoring Rules:

- 90-100 → Excellent match
- 75-89 → Good match
- 60-74 → Average match
- Below 60 → Poor match

Instructions:

1. Compare every important requirement from the job description with the resume.
2. Identify all matching technical skills.
3. Identify all important missing skills.
4. Give practical resume improvement suggestions.
5. Do NOT hallucinate skills or experience.
6. Base your evaluation only on the provided resume.
7. Keep the summary concise (2-3 sentences).
8. Return ONLY the structured output.

------------------------
JOB DESCRIPTION
------------------------

{job_desc}

------------------------
RESUME
------------------------

{resume}
`);
    const chain = template.pipe(StrModel);

    const result = await chain.invoke({
      job_desc: job_desc,
      resume: resume,
    });

    console.log("+++++++-_______++++++++++");
    console.log(result);

    return res.status(200).json({
      success: true,
      message: "Resume Matched Successfully against Job Description.",
      data: result,
    });
  } catch (error) {
    console.error(
      "Error Occuered While Matching Resume with Job Description :",
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Error Occuered While Matching Resume with Job Description",
      error,
    });
  }
};
