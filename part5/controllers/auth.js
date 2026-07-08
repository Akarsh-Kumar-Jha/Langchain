import { tryCatch } from "bullmq";
import supabase from "../utils/supabaseClient.js";

// async function signUpNewUser() {
//   const { data, error } = await supabase.auth.signUp({
//     email: 'valid.email@supabase.io',
//     password: 'example-password',
//     options: {
//       emailRedirectTo: 'https://example.com/welcome',
//     },
//   })
// };

export const Signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please Provide ALl Fields Email And Password and Name!",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error Occuered While Siging Up",
        error,
      });
    }

    const { data: dbData, error: dbErr } = await supabase.from("Users").insert({
      user_id: data.user.id,
      name: name,
      profile_img: `https://api.dicebear.com/10.x/initials/svg?seed=${name}`,
    });

    console.log("Data After Signing UP == ", data);

    return res.status(200).json({
      success: true,
      message: "User Signed Up Succesfully.",
      data,
      dbData,
    });
  } catch (error) {
    console.error("Error Occuered While Siging Up :", error);
    return res.status(500).json({
      success: false,
      message: "Error Occuered While Siging Up",
      error,
    });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please Provide ALl Fields Email And Password",
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error Occuered While Siging In",
        error,
      });
    }

    console.log(`SignIN Sucessfull with data : ${data}`);

    return res
      .cookie("token", data.session.access_token, {
        maxAge: 172800000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
      .cookie("refresh_token", data.session.refresh_token, {
        maxAge: 604800000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        message: "SignIn SucessFull.",
        data,
      });
  } catch (error) {
    console.error("Error Occuered While Siging In :", error);
    return res.status(500).json({
      success: false,
      message: "Error Occuered While Siging In",
      error,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User Not Found!",
      });
    }

    const { data, error } = await supabase
      .from("Users")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Error Occuered While Getting User",
        error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Found.",
      data,
    });
  } catch (error) {
    console.error("Error Occuered While Getting User:", error);
    return res.status(500).json({
      success: false,
      message: "Error Occuered While Getting User",
      error,
    });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .clearCookie("token")
      .clearCookie("refresh_token")
      .status(200)
      .json({
        success: true,
        message: "Logout Successfull.",
      });
  } catch (error) {
    console.error("Error Occuered While Logging Out:", error);
    return res.status(500).json({
      success: false,
      message: "Error Occuered While Logging Out",
      error,
    });
  }
};
