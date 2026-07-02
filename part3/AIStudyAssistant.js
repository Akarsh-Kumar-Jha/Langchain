import {ChatGroq} from "@langchain/groq";
import {PromptTemplate} from "@langchain/core/prompts"
import { RunnableLambda, RunnableParallel, RunnablePassthrough, RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import * as z from "zod";
import express from "express";


dotenv.config();

const app = express();
app.use(express.json());


const model = new ChatGroq({
    model:"openai/gpt-oss-120b"
});

const summarySchema = z.object({
    summary:z.string()
});

const quizSchema = z.object({
    quiz:z.array(z.string())
});

const roadMapSchema = z.object({
    roadmap:z.string()
});

const struSummaryModel = model.withStructuredOutput(summarySchema);
const struQuizModel = model.withStructuredOutput(quizSchema);
const struRoadMapModel = model.withStructuredOutput(roadMapSchema);

const summaryPromptTemplate = PromptTemplate.fromTemplate("Give Summary Of The Following Topic : {topic} according {level} level");
const quizPromptTemplate = PromptTemplate.fromTemplate("Generate an Quiz of about 4-5 questions on the topic : {topic} according {level} level");
const roadMapTemplate = PromptTemplate.fromTemplate("Give RoadMap To Complete The Topic : {topic} according {level} level");

const parser = new StringOutputParser();

const summaryChain = RunnableSequence.from([summaryPromptTemplate,struSummaryModel]);
const quizChain = RunnableSequence.from([quizPromptTemplate,struQuizModel]);
const roadMapChain = RunnableSequence.from([roadMapTemplate,struRoadMapModel]);


const parallelChain = RunnableParallel.from({
    'topic':RunnableLambda.from((input) => input.topic),
    'summmary':RunnableSequence.from([summaryChain,RunnableLambda.from((input) => input.summary)]),
    'quiz':RunnableSequence.from([quizChain,RunnableLambda.from((input) => input.quiz)]),
    'roadmap':RunnableSequence.from([roadMapChain,RunnableLambda.from((input) => input.roadmap)]),
    'difficulty':RunnableLambda.from((input) => input.level)
});

const callModel = async(topic,level) => {
    try {
        const result = await parallelChain.invoke({
            topic:topic,
            level:level
        });
        console.log('Response :',result);
        return result;
        
    } catch (error) {
        console.error('Error Occuered :',error);
    }
};

// callModel();
const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server Running On PORT:${PORT}`);
});

app.get('/',(req,res) => {
    return res.status(200).json({
        success:true,
        message:"AI Study Assistant Working Fine!"
    });
});

app.post('/ask',async(req,res) => {
    try{

        const {topic,level} = req.body;

        if(!topic || !level){
            return res.status(400).json({
                success:false,
                message:'Topic Or Level Not Given!'
            });
        };

        const result = await callModel(topic,level);
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
});


