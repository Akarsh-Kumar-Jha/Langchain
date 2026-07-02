import {ChatGroq} from "@langchain/groq";
import {PromptTemplate} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import { RunnableParallel } from "@langchain/core/runnables";
import express from "express";
import * as z from "zod";


dotenv.config();
const app = express();
app.use(express.json());

const model1 = new ChatGroq({
    model:"openai/gpt-oss-120b"
});

const model2 = new ChatGroq({
    model:"llama-3.3-70b-versatile"
});

const model3 = new ChatGroq({
    model:"openai/gpt-oss-120b"
});

const parser = new StringOutputParser();

const NotesTemplate = PromptTemplate.fromTemplate("Give an Short but efftective Notes On The Topic:{topic}");
const QuizTemplate = PromptTemplate.fromTemplate("Give 5-7 Question and Answers On The Topic:{topic}");

const noteChain = NotesTemplate.pipe(model1).pipe(parser);
const quizChain = QuizTemplate.pipe(model2).pipe(parser);


const parallelChain = RunnableParallel.from({
    note:noteChain,
    quiz:quizChain
});

const finalTemplate = PromptTemplate.fromTemplate("Merge The Following Two Things and give an short output.\n {note} \n\n {quiz} and give according to Schema Provided");

const OutputSchema = z.object({
    HTML:z.string("After Combining The Final Output In HTML Format."),
    markdown:z.string("After Combining The Final Output In Markdown Format.")
});

const structuredFinalModel = model3.withStructuredOutput(OutputSchema);

const chain = parallelChain.pipe(finalTemplate).pipe(structuredFinalModel);

const CallGroq = async(topic) => {
    try {

        const result = await chain.invoke({
            topic:topic
        });

        console.log('Response :',result);
        return result;

     
    } catch (error) {
        console.error('Error Occuered While Model Calling:',error);
    }
};

// CallGroq();

const PORT = process.env.PORT || 5000;

app.listen(PORT,() => {
    console.log(`Server Started On PORT:${PORT}`);
});

app.get('/',(req,res) => {
    return res.status(200).json({
        success:true,
        message:'Server Running Fine!'
    });
});

app.post('/note',async(req,res) => {
    try {
        const {topic} = req.body;
        if(!topic){
            return res.status(400).json({
                success:false,
                message:"Topic Mot Found!"
            });
        };

        const result = await CallGroq(topic);
        console.log('Response : ',result);

        return res.status(200).json({
            success:true,
            output:result
        });

        
    } catch (error) {
        console.error('Err Occuered :',error);
        return res.status(500).json({
            success:false,
            message:'Error Occuered While Note Creation.',
            error
        });
    }
})