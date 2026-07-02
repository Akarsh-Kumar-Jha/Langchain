import {ChatGroq} from "@langchain/groq";
import {PromptTemplate} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import { RunnableParallel } from "@langchain/core/runnables";


dotenv.config();

const model1 = new ChatGroq({
    model:"openai/gpt-oss-120b"
});

const model2 = new ChatGroq({
    model:"llama-3.3-70b-versatile"
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

const finalTemplate = PromptTemplate.fromTemplate("Merge The Following Two Things.\n {note} \n\n {quiz}");

const chain = parallelChain.pipe(finalTemplate).pipe(model1).pipe(parser);

const CallGroq = async() => {
    try {

        const result = await chain.invoke({
            topic:'Redis'
        });

        console.log('Response :',result);

     
    } catch (error) {
        console.error('Error Occuered While Model Calling:',error);
    }
};

CallGroq();