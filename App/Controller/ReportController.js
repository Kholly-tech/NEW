const Report = require("../Models/ReportModel");

const createReport = async (req, res) => {
    const userId = req.user._id;
    const reasons = req.body.reasons;
    try {
        // check if the item has been reported before
        const prevReport = await Report.findOne({
            reportedItem: req.body.reportedItem,
        });
        

        if ( prevReport && prevReport.reportedBy.includes(userId)) {
            return res.status(400).send({
                message: "You have already reported this item",
            });
        }
        else if (prevReport) {
            reasons.forEach(reason => {
                if(prevReport.reasons.includes(reason)) {
                    
                }
                else {
                    prevReport.reasons.push(reason);
                }
            });
            prevReport.reportedBy.push(userId);
            prevReport.count += 1;
            await prevReport.save();
            return res.status(200).send({
                message: "Report successful",
            });
        }

        // Create a new report
        const report = new Report({
            ...req.body,
            reportedBy: userId,
            count: 1,
        });
        await report.save();
        return res.status(200).send({report, message: "Report successful"});
    } catch (error) {
        console.log(error); // Log the error for debugging
        res.status(500).send(error);
    }
};

module.exports = {
    createReport
}