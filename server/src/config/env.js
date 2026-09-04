const path = require("path");
const dotenv = require("dotenv");

// Load the backend's own .env regardless of whether the server is started from
// the repository root or from the server directory. Platform environment
// variables always win because dotenv does not overwrite existing values.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
