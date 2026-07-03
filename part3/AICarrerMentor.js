import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableParallel, RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogle } from "@langchain/google";
import dotenv from "dotenv";
import express from "express";
import { success } from "zod";
import cors from "cors";
dotenv.config();

const app = express();
app.use(express.json());

app.use(
    cors({
        origin:"http://localhost:5173",
    })
);


const model = new ChatGoogle("gemini-2.5-flash");

const parser = new StringOutputParser();

const roadmapTemplate = PromptTemplate.fromTemplate(
  "You Are a Carrer Mentor.Give an RoadMap for the role:{role} \n with experience:{experience} \n and goal:{goal}",
);

const resourcesTemplate = PromptTemplate.fromTemplate(
    `Give Resources for job Role:{role} \n with experience:{experience} \n and goal:{goal}.
    Return

Books

Courses

YouTube

Documentation

Projects

Open Source

Interview Prep
    `
);

const interviewQuestionsTemplate = PromptTemplate.fromTemplate(
    "You are An Interviewer.Give some Important Interview Questions.for the role:{role} \n with experience:{experience} \n and goal:{goal}."
);

const salaryAdviceTemplate = PromptTemplate.fromTemplate(
   `
   You are an experienced Software Engineering Career Mentor.

Give salary advice for

Role:
{role}

Experience:
{experience}

Goal:
{goal}

Return:

1. Expected Salary
2. Negotiation Tips
3. Common Mistakes
4. Skills to increase salary
   `
);

const roadMapChain = RunnableSequence.from([roadmapTemplate,model,parser]);
const resourcesChain = RunnableSequence.from([resourcesTemplate,model,parser]);
const interviewQuestionsChain = RunnableSequence.from([interviewQuestionsTemplate,model,parser]);
const salaryAdviceChain = RunnableSequence.from([salaryAdviceTemplate,model,parser]);

const parallelChain = RunnableParallel.from({
    'role':RunnableLambda.from((input) => input.role),
    'experience':RunnableLambda.from((input) => input.experience),
    'goal':RunnableLambda.from((input) => input.goal),
    'roadmap':roadMapChain,
    'resources':resourcesChain,
    'interviewQuestions':interviewQuestionsChain,
    'salaryAdvice':salaryAdviceChain
});


const callModel = async(role,experience,goal) => {
    try {

        const result = await parallelChain.invoke({
            role:role,
            experience:experience,
            goal:goal
        });

        console.log('Response :',result);
        return result;
        
    } catch (error) {
        console.error('error occuered While Generation :',error);
    }
};


const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server Running On PORT:${PORT}`);
});

app.get('/',(req,res) => {
    return res.status(200).json({
        success:true,
        message:"AI Carrer Mentor Working Fine!"
    });
});

app.post('/ask',async(req,res) => {
    try{

        const {role,experience,goal} = req.body;

        if(!role || !experience || !goal){
            return res.status(400).json({
                success:false,
                message:'Please Provide All Inputs!'
            });
        };

        const result = await callModel(role,experience,goal);
        console.log('Response :',result);

        return res.status(200).json({
            success:true,
            message:'Response Generated.',
            data:result
        });

    }catch(error){
        console.error('Error Occuered While Generation :',error);
        return res.status(500).json({
            success:false,
            message:'Error Occeured While Generation',
            error
        });
    };
})


