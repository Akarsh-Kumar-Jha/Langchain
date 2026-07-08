import embeddingsQueue from "../utils/queue.js";
import supabase from "../utils/supabaseClient.js";
import { createClient } from "@supabase/supabase-js";


export const fileUplaod = async(req,res) => {
    try {

        const resume = req.files.resume;


        console.log('req.files.resume = ',req.files.resume);

        if(!resume){
            return res.status(401).json({
                success:false,
                message:'Please Provide Resume!'
            });
        };
        if(resume.mimetype!=="application/pdf"){
            return res.status(401).json({
                success:false,
                message:'Please Provide PDF File!'
            });
        };
        if(resume.size>15*1024*1024){
            return res.status(401).json({
                success:false,
                message:'Please Provide File Less Than 15MB!'
            });
        }

const fileName = `public/${req.user.id}-resume.pdf`;

console.log('fileName = ',fileName);

const supabaseUpload = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${req.cookies.token}`,
      },
    },
  }
);

const { data, error } = await supabaseUpload.storage
  .from("Resumes")
  .upload(fileName, resume.data, {
    contentType: "application/pdf",
    upsert: true,
  });

console.log(data);
console.log(error);
  
if (error) {
  console.error(error);
  return
};


const ResumePath = data.path;

const { error:DBerr } = await supabase
  .from('Users')
  .update({ Resume_path: ResumePath })
  .eq('user_id', req.user.id);

  if(DBerr){
    return res.status(400).json({
        success:false,
        message:'Error Uploading File :',
        error:DBerr
    });
  };

console.log('File Uploaded : ',data);
console.log('/////Adding Into Queue//////');
await embeddingsQueue.add(`user-${req.user.id}-emb`, { filePath: fileName,user:req.user });


return res.status(200).json({
    success:true,
    message:'File Uploaded Succesfully.',
    data:data
})
        
    } catch (error) {
        console.error('Error While File Uploading :',error);
        return res.status(500).json({
            success:false,
            message:"Error While File Uploading",
            error
        });
    };
}