"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const report_1 = require("./routes/report");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "200mb" }));
app.use((0, cors_1.default)());
app.post("/download", (req, res) => {
    let { reportName, fileName, data } = req.body;
    if (!data || data === "") {
        res.status(400).send("'data' is not provided");
        return;
    }
    if (!reportName || reportName === "") {
        res.status(400).send("'reportName' is not provided");
        return;
    }
    if (!fileName || fileName === "") {
        res.status(400).send("'fileName' is not provided");
        return;
    }
    (0, report_1.parseTemplateAndDownload)(data, reportName, fileName, res);
});
app.get("/health", (req, res) => {
    res.status(200).end();
});
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 9001;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=app.js.map