const inputParams = {
    processID: { string: { uuid: true }, required: true },
    taskID: { string: { uuid: true }, required: true },
    instanceID: { required: true },
    values: { required: true },
};

module.exports = function (req, res) {
    req.ab.log(`process_manager::user-form`);

    if (
        !(req.ab.validUser(/* false */)) ||
        !req.ab.validateParameters(inputParams /*, false , valuesToCheck*/)
    ) {
        // an error message is automatically returned to the client
        // so be sure to return here;
        return;
    }

    // create a new job for the service
    const jobData = {
        processID: req.ab.param("processID"),
        taskID: req.ab.param("taskID"),
        instanceID: req.ab.param("instanceID"),
        values: JSON.stringify(req.ab.param("values")),
    };

    // pass the request off to the Service:
    req.ab.serviceRequest(
        "process_manager.userform.update",
        jobData,
        (err, results) => {
            if (err) {
                res.ab.error(err);
                return;
            }
            res.ab.success(results);
        }
    );
};
