const FOLDER_ID = '1neQezvGbuy8t7iu36Pd6ia4dNX_MMUfH';
const SPREADSHEET_ID = '17fSNC4IA6rFseTWjxlfDiHUHImoAETX9-w2VGaoZxow';

function doGet(e) {
    let html = HtmlService.createTemplateFromFile('index');
    html.grade = e.parameter.grade || '1';
    html.subject = e.parameter.subject || '未設定';
    html.teacher = e.parameter.teacher || '共通';
    html.testId = e.parameter.testId || '';
    html.type = e.parameter.type || '';
    return html.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        if (data.action === "submit_question") {
            var question = data.question;
            var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
            var sheet = ss.getSheetByName("質問箱");
            var lastRow = sheet.getDataRange().getLastRow();
            var nextNo = lastRow;
            var targetRow = lastRow + 1;

            sheet.getRange(targetRow, 1, 1, 2).setValues([[nextNo, question]]);

            var emailTo = PropertiesService.getScriptProperties().getProperty('QA_EMAIL');
            var subject = "新しい質問が届きました";
            var now = new Date();
            var dateStr = Utilities.formatDate(now, "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
            var answerLink = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/edit?gid=24943130#gid=24943130&range=A" + targetRow;

            var body = "新しい質問が届きました。\n質問日時: " + dateStr + "\n質問内容:\n" + question + "\n\n回答する: " + answerLink;
            sendQuestionMail(body);

            return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }

        if (data.action === "add_teacher") {
            var grade = data.grade;
            var subjectCat = data.subjectCat;
            var subjectName = data.subjectName;
            var subjectAbbr = data.subjectAbbr;
            var teacherName = data.teacherName;

            var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
            var sheet = ss.getSheetByName("教員一覧");
            var values = sheet.getDataRange().getValues();

            var insertRow = values.length + 1;
            for (var i = values.length - 1; i >= 1; i--) {
                if (values[i][0] === grade && values[i][2] === subjectName) {
                    insertRow = i + 2;
                    break;
                }
            }

            sheet.insertRowAfter(insertRow - 1);
            sheet.getRange(insertRow, 1, 1, 6).setValues([[grade, subjectCat, subjectName, subjectAbbr, teacherName, ""]]);

            return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
        }
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function processUpload(formObject) {
    try {
        var grade = formObject.grade;
        var nendoFull = formObject.nendo; // e.g., 2024
        var nendo = nendoFull.slice(-2);
        var testId = formObject.testId;
        var subject = formObject.subject;
        var teacherStr = formObject.teacherInput || formObject.teacher;
        // Split by newlines or multiple spaces (including full-width) to detect multiple teachers
        var teacherNames = teacherStr.split(/[\n\s　]+/).filter(function (name) { return name.trim() !== ''; });
        var teacher = teacherNames.join(' ');

        // If multiple teachers, use "共通" for the file name
        var teacherForName = teacherNames.length > 1 ? "共通" : teacher;

        var type = formObject.type; // 問題 or 解答
        var isImage = formObject.uploadMode === 'image';

        var testName0 = grade + "_" + nendo + testId + "_" + subject + "_" + teacherForName;
        var finalName = testName0 + "_" + type;

        var folder = DriveApp.getFolderById(FOLDER_ID);

        if (isImage) {
            // Base64配列から処理する方式（複数画像対応）
            var imageDataArray = formObject.imageDataArray;
            if (!imageDataArray || imageDataArray.length === 0) throw new Error("画像がありません");

            var fileIds = [];
            for (var i = 0; i < imageDataArray.length; i++) {
                var imgData = imageDataArray[i];
                var blob = Utilities.newBlob(
                    Utilities.base64Decode(imgData.base64),
                    imgData.mimeType,
                    imgData.name
                );
                var tempFile = folder.createFile(blob);
                fileIds.push(tempFile.getId());
            }

            var pdfFile = createPdfFromImagesWithTemplateSlides(fileIds, finalName, FOLDER_ID);
            var insertedRow;
            if (pdfFile) {
                insertedRow = recordToSpreadsheet(grade, nendo, testId, teacher, type, pdfFile.getName(), pdfFile.getId());
            }

            // 一時ファイル削除
            for (var i = 0; i < fileIds.length; i++) {
                DriveApp.getFileById(fileIds[i]).setTrashed(true);
            }

        } else {
            var pdfBlob = formObject.pdfFile;
            var pdfFile = folder.createFile(pdfBlob);
            pdfFile.setName(finalName + ".pdf");
            var insertedRow = recordToSpreadsheet(grade, nendo, testId, teacher, type, pdfFile.getName(), pdfFile.getId());
        }

        var gid = "1548533520";
        var mailBody = "以下の過去問がアップロードされました。スプレッドシートで内容を確認し、チェックボックス（H列）をオンにしてください。\n\n" +
            "ファイル名: " + finalName + "\n" +
            "URL: https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/edit?gid=" + gid + "#gid=" + gid + "&range=A" + insertedRow;
        sendKakomonMail(mailBody);

        return { success: true };
    } catch (e) {
        return { success: false, error: e.toString() };
    }
}

function recordToSpreadsheet(grade, nendo, testId, teacher, type, fileName, fileId) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName("過去問");
    sheet.appendRow([grade, nendo, testId, teacher, type, fileName, fileId, false]);
    return sheet.getLastRow();
}

/**
 * テンプレートスライドを使用して画像からPDFを生成する関数
 */
function createPdfFromImagesWithTemplateSlides(imageFileIds, outputPdfName, destinationFolderId) {
    var presentationId = null;
    try {
        if (!imageFileIds || imageFileIds.length === 0) return null;
        var PORTRAIT_TEMPLATE_ID = '1gxj6-R5wfrqzUanGOyrUWykyhMQLds6LtQ3CmmGt8CE';
        var LANDSCAPE_TEMPLATE_ID = '1WG-cIOs1jopdooYRxXPNpuLwqAcBntMDkvUY0OiU5-g';

        var firstImageFile = DriveApp.getFileById(imageFileIds[0]);
        var firstImageBlob = firstImageFile.getBlob();
        var tempPresentation = SlidesApp.create('temp_size_check_' + new Date().getTime());
        var tempSlide = tempPresentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
        var tempImage = tempSlide.insertImage(firstImageBlob);
        var imageWidth = tempImage.getWidth();
        var imageHeight = tempImage.getHeight();
        DriveApp.getFileById(tempPresentation.getId()).setTrashed(true);

        var isLandscape = imageWidth > imageHeight;
        var templateId = isLandscape ? LANDSCAPE_TEMPLATE_ID : PORTRAIT_TEMPLATE_ID;

        var templateFile = DriveApp.getFileById(templateId);
        var presentationName = outputPdfName + '_temp_slides_' + new Date().getTime();
        var copiedFile = templateFile.makeCopy(presentationName);
        presentationId = copiedFile.getId();

        var presentation = SlidesApp.openById(presentationId);
        var existingSlides = presentation.getSlides();
        for (var i = 0; i < existingSlides.length; i++) {
            existingSlides[i].remove();
        }

        var slideWidth = isLandscape ? 841.89 : 595.28;
        var slideHeight = isLandscape ? 595.28 : 841.89;

        for (let i = 0; i < imageFileIds.length; i++) {
            var imageFileId = imageFileIds[i];
            var imageFile = DriveApp.getFileById(imageFileId);
            var imageBlob = imageFile.getBlob();
            var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
            var image = slide.insertImage(imageBlob);

            var imgWidth = image.getWidth();
            var imgHeight = image.getHeight();
            var scale = Math.min(slideWidth / imgWidth, slideHeight / imgHeight);
            var newImgWidth = imgWidth * scale;
            var newImgHeight = imgHeight * scale;

            image.setWidth(newImgWidth);
            image.setHeight(newImgHeight);
            image.setLeft((slideWidth - newImgWidth) / 2).setTop((slideHeight - newImgHeight) / 2);
        }

        presentation.saveAndClose();
        var presentationFile = DriveApp.getFileById(presentationId);
        var pdfBlob = presentationFile.getAs('application/pdf');
        var destinationFolder = DriveApp.getFolderById(destinationFolderId);
        var finalPdfName = outputPdfName + '.pdf';
        var pdfFile = destinationFolder.createFile(pdfBlob);
        pdfFile.setName(finalPdfName);

        presentationFile.setTrashed(true);
        return pdfFile;
    } catch (error) {
        if (presentationId) DriveApp.getFileById(presentationId).setTrashed(true);
        return null;
    }
}

function sendQuestionMail(body) {
    var subject = "質問箱通知";
    var emailTo = PropertiesService.getScriptProperties().getProperty('QA_EMAIL');
    var threads = GmailApp.search('in:sent subject:"質問箱通知"');

    if (threads.length > 0) {
        threads[0].reply(body);
    } else {
        GmailApp.sendEmail(emailTo, subject, body);
    }
}

function sendKakomonMail(body) {
    var subject = "過去問アップロード通知";
    var emailTo = PropertiesService.getScriptProperties().getProperty('KAKOMON_EMAIL');
    var threads = GmailApp.search('in:sent subject:"過去問アップロード通知"');

    if (threads.length > 0) {
        threads[0].reply(body);
    } else {
        GmailApp.sendEmail(emailTo, subject, body);
    }
}