require("chromedriver");
let fs = require("fs");
let swd = require("selenium-webdriver");

let cFile = process.argv[2];
let questionsFile = process.argv[3];
//let Moderator = process.argv[4];

let bldr = new swd.Builder();
let driver = bldr.forBrowser("chrome").build();

(async function () {
    try {
        // Login
        await driver.manage().setTimeouts({ implicit: 10000, pageLoad: 10000 })
        await loginHelper();
        // Go to Administrator
        let dropDownBtn = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDown]"));
        await dropDownBtn.click();
        let adminBtn = await driver.findElement(swd.By.css("a[data-analytics=NavBarProfileDropDownAdministration]"));
        await adminBtn.click();
        // wait for loader
        await waitForLoader();
        // Go to contest tabs
        // await driver.navigate().refresh();
        let manageTabs = await driver.findElements(swd.By.css(".administration header ul li"));
        await manageTabs[1].click();
        let question = require(questionsFile);
        let curl = await driver.getCurrentUrl();
        //console.log(curl);

        let qidx = 0;
        let questionElement = await getQuestionElement(curl, qidx);
        while (questionElement !== undefined) {
            await addTestCase(questionElement, question[qidx]);

            qidx++;
            questionElement = await getQuestionElement(curl, qidx);
        }

    }
    catch (err) {
        console.log(err);
    };
})()
async function loginHelper() {
    let data = await fs.promises.readFile(cFile);
    let { url, pwd, user } = JSON.parse(data);
    await driver.get(url);
    let userFound = driver.findElement(swd.By.css("#input-1"));
    let passFound = driver.findElement(swd.By.css("#input-2"));
    let ElementsArr = await Promise.all([userFound, passFound]);
    let userEntered = ElementsArr[0].sendKeys(user);
    let passEntered = ElementsArr[1].sendKeys(pwd);
    await Promise.all([userEntered, passEntered]);
    let loginBtn = driver.findElement(swd.By.css("button[data-analytics=LoginPassword]"));
    await loginBtn.click();
}
async function getQuestionElement(curl, qidx) {
    await driver.get(curl);

    let pidx = parseInt(qidx / 10);
    qidx = qidx % 10;
    //console.log(pidx + " " + qidx);

    let paginationBtns = await driver.findElements(swd.By.css('.pagination li'));
    let nextPageBtn = paginationBtns[paginationBtns.length - 2];
    let classOnNextPageBtn = await nextPageBtn.getAttribute('class');
    for (let i = 0; i < pidx; i++) {
        if (classOnNextPageBtn !== 'disabled') {
            await nextPageBtn.click();

            paginationBtns = await driver.findElements(swd.By.css('.pagination li'));
            nextPageBtn = paginationBtns[paginationBtns.length - 2];
            classOnNextPageBtn = await nextPageBtn.getAttribute('class');
        } else {
            return undefined;
        }
    }

    let questionElements = await driver.findElements(swd.By.css('.backbone.block-center'));
    if (qidx < questionElements.length) {
        return questionElements[qidx];
    } else {
        return undefined;
    }
}
async function addTestCase(questionElement, cQues) {
    let qurl = await questionElement.getAttribute('href');
    await questionElement.click();
    await driver.wait(swd.until.elementLocated(swd.By.css('span.tag')));
    let testCaseTab = await driver.findElement(swd.By.css("li[data-tab=testcases]"));
    await testCaseTab.click();
    console.log("TestCase Tab clicked");
    let url = await driver.getCurrentUrl();
    console.log(url);
    let testCaseArr = cQues["Testcases"];
    for (let i = 0; i < testCaseArr.length; i++) {
        let addTestCaseBtn = await driver.findElement(swd.By.css(".btn.add-testcase.btn-green"));
        await addTestCaseBtn.click();
        waitForLoader();
        console.log("Add test case Clicked Line 99");
        let TagsInput = await driver.findElement(swd.By.css("input[id=tag]"));
        await TagsInput.sendKeys(cQues["Tags"]);
        let inputEle = await driver.findElement(swd.By.css(".formgroup.horizontal.input-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div textarea"));
        let outputEle = await driver.findElement(swd.By.css(".formgroup.horizontal.output-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div textarea"));
        await editorHandler(".formgroup.horizontal.input-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div", inputEle, cQues["Testcases"][i]["Input"]);
        await editorHandler(".formgroup.horizontal.output-testcase-row.row .CodeMirror.cm-s-default.CodeMirror-wrap div", outputEle, cQues["Testcases"][i]["Output"]);
        let saveBtn = await driver.findElement(swd.By.css(".btn.btn-primary.btn-large.save-testcase"));
        await saveBtn.click();
        let final_time = Date.now() + 3000;
        while (final_time >= Date.now()) { }
    }
    let savechanges = await driver.findElement(swd.By.css(".save-challenge.btn.btn-green"));
    await savechanges.click();
    console.log("Add test case Clicked Line 127");
    await waitForLoader();
}
async function waitForLoader() {
    let loader = await driver.findElement(swd.By.css("#ajax-msg"));
    await driver.wait(swd.until.elementIsNotVisible(loader));
}
async function editorHandler(parentSelector, element, data) {
    let parent = await driver.findElement(swd.By.css(parentSelector));
    // selenium => browser js execute 
    await driver.executeScript("arguments[0].style.height='10px'", parent);
    await element.sendKeys(data);
}