// src/api/v1/platform-a/kyc/index.js
import auth from "./auth.routes.js";
import userRoutes from "./user.routes.js";

const authroutes = {
    auth,
    userRoutes,
};

export default authroutes;