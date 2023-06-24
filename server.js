const express = require("express");
const util = require("util");
const fs = require("fs");
const { report } = require("process");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);

async function getReports() {
  try {
    const data = await readFilePromise("reports.json", "utf8");
    const jsonData = JSON.parse(data);
    return jsonData;
  } catch (error) {
    console.error(error);
    throw new Error("Error reading or parsing JSON file");
  }
}

app.get("/reports", async (req, res) => {
  const reports = await getReports();
  res.send({
    total: reports.length,
    data: reports,
  });
});

app.get("/reports/:reportId", async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const reports = await getReports();
  const report = reports.find((item) => item.report_id === reportId);
  res.send({
    total: 1,
    data: report,
  });
});

app.post("/reports", async (req, res) => {
  const reports = await getReports();
  const newReport = req.body;

  const report = reports.find((item) => item.report_id === newReport.report_id);
  if (report) {
    res.status(400).send({
      message: "Duplicate Id not allowed",
      statusCode: 400,
    });
    return;
  }
  const lastReportId = reports[reports.length - 1].report_id;
  const newReportId = lastReportId + 1;
  newReport.report_id = newReportId;
  reports.push(newReport);
  const updatedJson = JSON.stringify(reports);
  await writeFilePromise("reports.json", updatedJson, "utf8");
  res.status(200).send({
    message: "Successfully added report",
    statusCode: 200,
  });
});

app.put("/reports/:reportId", async (req, res) => {
  const reportId = parseInt(req.params.reportId);
  const reports = await getReports();
  const newReport = req.body;

  const reportIndex = reports.findIndex((item) => item.report_id === reportId);
  if (reportIndex === -1) {
    res.status(404).send({
      message: "Cannot find report",
      statusCode: 404,
    });
    return;
  }

  reports[reportIndex] = {
    ...reports[reportIndex],
    ...newReport,
    report_id: reports[reportIndex].report_id,
  };
  const updatedJson = JSON.stringify(reports);
  await writeFilePromise("reports.json", updatedJson, "utf8");
  res.status(200).send({
    message: "Successfully updated report",
    statusCode: 200,
  });
});

app.listen(3081, () => console.log("listening on port 3081"));
