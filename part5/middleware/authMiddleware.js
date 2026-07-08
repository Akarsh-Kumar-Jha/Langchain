import supabase from "../utils/supabaseClient.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    const refresh_token = req.cookies.refresh_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Not Found!",
      });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      if (!refresh_token) {
        return res.status(401).json({
          success: false,
          message: "Please sign in again.",
        });
      }
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });
      if (error || !data.session || !data.user) {
        return res.status(401).json({
          success: false,
          message: "Session refresh failed",
          error
        });
      }
      const { session, user: refreshedUser } = data;

      console.log("Token Refreshed ::::", session);

      res.cookie("token", session.access_token, {
        maxAge: 172800000,
        httpOnly: true,
      });

      res.cookie("refresh_token", session.refresh_token, {
        maxAge: 604800000,
        httpOnly: true,
      });

      req.user = refreshedUser;

      return next();
    }

    req.user = user;

    console.log(`User Verified Succesfully with token:${token} :`, req.user);
    next();
  } catch (error) {
    console.error("Error While Verifying User :", error);
    return res.status(500).json({
      success: false,
      message: "Error While Verifying User IN Auth Middleware!",
      error,
    });
  }
};
