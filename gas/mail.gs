function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        return handleMailPost(data);
    } catch (err) {
        return jsonOutput_({ status: "error", message: err.toString() });
    }
}

function handleMailPost(data) {
    try {
        var expectedSecret = PropertiesService.getScriptProperties().getProperty('MAIL_SHARED_SECRET');
        if (!expectedSecret) {
            return jsonOutput_({ status: "error", message: "MAIL_SHARED_SECRET is not set" });
        }

        if (!data || data.secret !== expectedSecret) {
            return jsonOutput_({ status: "error", message: "Unauthorized" });
        }

        var to = (data.to || "").toString().trim();
        var subject = (data.subject || "").toString();
        var text = (data.text || "").toString();
        var from = (data.from || "").toString().trim();
        var fromName = (data.fromName || "テストお役立ちくん").toString();
        var labelName = (data.labelName || "テストお役立ちくん").toString();

        if (!to || !subject || !text) {
            return jsonOutput_({ status: "error", message: "Missing required fields" });
        }

        var options = {
            name: fromName
        };

        if (from) {
            options.from = from;
        }

        GmailApp.sendEmail(to, subject, text, options);

        addLabelToLatestSentMail_(to, subject, labelName);

        return jsonOutput_({ status: "success" });
    } catch (err) {
        return jsonOutput_({ status: "error", message: err.toString() });
    }
}

function addLabelToLatestSentMail_(to, subject, labelName) {
    var query = 'in:sent to:' + to + ' subject:"' + subject.replace(/"/g, '\\"') + '" newer_than:2d';
    var threads = GmailApp.search(query, 0, 10);
    if (!threads || threads.length === 0) return;

    var label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
        label = GmailApp.createLabel(labelName);
    }

    label.addToThread(threads[0]);
    threads[0].moveToTrash();
}

function jsonOutput_(obj) {
    return ContentService
        .createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}
