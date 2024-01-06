/**
 * Author : prasenjitj@google.com
 */
function scriptCache() {
  var sp_key = '1231232';
  //var ss = SpreadsheetApp.openById(sp_Key); 
  //var s = ss.getSheetByName("test_Sheet");
  var cache = CacheService.getScriptCache();
  var val = "xyz"
  cache.put('A', val);
  var cache = CacheService.getPublicCache();
  Logger.log(cache.get('A'));
}
function test2 () {
  var data = getPlxData(getScriptText);
  Logger.log(data);
}
function test() {
  const SHEET_KEY = "1qwRAmyRDpx-qymI48B8fNAVHcLBU1uYa1_RDouHDb9g";
  const DATA_RANGE = "sheet2!E2:E";
  const TEST_KEY = "id:(298142041 | 299251410 | 273862124 | 290864794 | 298922756 | 297362619 | 291201964 | 278260677 | 272404623 | 295913706)";
  const TEST_KEY2 = "hotlistid:(2079536 4523453) -hotlistid:(4015112 | 4884836 | 1471629) status:open";
  const OKR_KEY = "hotlistid:2079533 status:open";

  console.time("LOG1");
  var bugs = getBugs(OKR_KEY);
  // bugs.forEach((bug) =>{
  //   console.log(bug.getID);
  // });
  console.log(bugs);
  console.timeEnd("LOG1");
}
// function test() {
//   const WORKSTATUSSHEET_KEY = "1lic2QroDbmdQhx462YQ-RiguLlF378C05V4iPYsKIXo";
//   const BANDWIDTH_RANGE = "self_utilisation!A2:B";

//   const SPREADSHEET_KEY = "1Ee0aE13LN01JOcI9FS349yYf6iozArwsvvsKl0lxdDg";
//   const FEEDBACK_RANGE = "feedback!A2:B";
//   values = [['a', 'b'], ['c', 'd']]
//   // appendSheetData(SPREADSHEET_KEY,FEEDBACK_RANGE,values);
//   // data = getSheetData(WORKSTATUSSHEET_KEY,BANDWIDTH_RANGE);
//   // console.log(data[0]);
//   // var data = getPlxData(getScriptText);
//   // Logger.log(data);
//   console.time('Execution Time');
//   var cache = CacheService.getScriptCache();
//   // cache.remove('data');
//   var cached = cache.get('data');
//   if (cached != null) {
//     cached = JSON.parse(cached)
//     console.log('>>', typeof cached);
//     console.log('>>',  cached);

//     console.timeEnd('Execution Time');
//     return cached[0];
//   }
//   let bugData = getBugs('hotlistid:2079536 status:open')
//   cache.put('data', JSON.stringify(bugData));
//   console.timeEnd('Execution Time');
//   console.log('>>>>', bugData[1]);
// }

function getScriptText() {
  let text = "SELECT * FROM daas_dev_team.team_vfs.productivity WHERE";
  text +=
    " ldap NOT IN ( 'prasenjitj', 'abin', 'rakshit', 'chaitanaya', 'khunger', 'nipunc','shaiqjeelani')";
  text += " AND date > '2021-12-31'";
  text += " AND Activity ='Absenteeism'";
  text += " AND team = 'VF Data Team (GUR)'";
  return text;
}

/**************** Main Logic Starts after this line  ****************/
const priorityEnum = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' };
const severityEnum = { 0: 'S0', 1: 'S1', 2: 'S2', 3: 'S3', 4: 'S4' };

function getCustomFieldsData(id, cfName) {
  var customFields = BuganizerApp.getBug(id).getCustomFields();
  let cfObj = {};
  for (let i in customFields) {
    cfObj[customFields[i].getName()] = customFields[i].getValue();
  }
  return cfObj[cfName];
}

function getBugs(key) {
  var bugs = BuganizerApp.searchBugs(key);
  let bugArray = [];
  for (let i in bugs) {
    let bugObj = {};
    let bug = bugs[i];
    let id = bug.getId();
    let summary = bug.getSummary();
    // console.log(id, summary);
    // let bug = BuganizerApp.getBug(id);
    bugObj.id = id;
    bugObj.title = summary;
    let cfs = getCustomFields(id);
    bugObj.projectStatus = cfs['Project Status'];
    bugObj.otd = Utilities.formatDate(new Date(cfs['Target Date']), "GMT", "yyyy-MM-dd");
    bugObj.eta = Utilities.formatDate(new Date(cfs['Agent ETA']), "GMT", "yyyy-MM-dd");
    bugObj.vfOrg = cfs['VF ORG Bug'];
    bugObj.primary = cfs['Primary'];
    bugObj.secondary = cfs['Secondary'];
    bugObj.reviewer = cfs['Reviewer'];
    bugObj.project = cfs['Project'];
    bugObj.assignee = bug.getAssignee();
    bugObj.priority = priorityEnum[bug.getPriority()];
    bugObj.severity = severityEnum[bug.getSeverity()];
    bugObj.type = bug.getType();
    bugObj.status = bug.getIssueStatus().toString();
    bugObj.keclient = cfs['KE Client'];
    bugObj.hotlists = bug.getHotlistIds();
    bugObj.children = bug.getChildren();
    bugArray.push(bugObj);
  }
  return bugArray;
}

/**
 * Returns the data values as array of arrays with specified datarange and sheetkey.
 * @param {String} sheetkey
 * @Param {String} datarange
 * @returns {Array} Array of data values from sheet.
 */
function getSheetData(sheetkey, datarange) {
  let range = Sheets.Spreadsheets.Values.get(sheetkey, datarange);
  let values = range.values;
  return values;
}
/**
 * Append data into spreadsheet.
 * @param {String} spreadsheetId
 * @param {string} range range of cells in the spreadsheet
 * @param valueInputOption determines how the input should be interpreted
 * @param {list<string>} _values list of rows of values to input
 */
function appendSheetData(spreadsheetId, range, _values) {
  let resource = {
    "majorDimension": "ROWS",
    "values": _values
  }
  let optionalArgs = { valueInputOption: "USER_ENTERED" };
  Sheets.Spreadsheets.Values.append(resource, spreadsheetId, range, optionalArgs);
}

/**
 * @param {String} scriptText
 */
function executeProjection_(scriptText) {
  let request = {
    queryRequest: {
      query: {
        text: scriptText(),
        engine: "DREMEL",
      },
    },
  };
  let projection = Plx.Projections.create(request);
  while (projection.state !== "done") {
    Utilities.sleep(2000);
    projection = getProjection_(projection);
  }
  return projection;
}

function getProjection_(projection) {
  return Plx.Projections.get(projection.id, { token: projection.token });
}
/**
 * @param {String} scriptText
 */
function getPlxData(scriptText) {
  let projection = executeProjection_(scriptText);
  // console.log(projection);
  let data = Utilities.parseCsv(projection.data);
  return data;
}

/**
 * 
 */
function getCustomFields(id) {
  var customFields = BuganizerApp.getBug(id).getCustomFields();
  let cfObj = {};
  for (let i in customFields) {
    cfObj[customFields[i].getName()] = customFields[i].getValue();
  }
  return cfObj;
}
/**
 * 
 */
function getBugTitle(bugNumber) {
  try {
    var bugName = BuganizerApp.getBug(bugNumber).getSummary();
  } catch (error) {
    console.log(error.message);
    let message = error.message.match(/Exception:\s(.*)/)[1];
    bugName = message;
  }
  // console.log(bugName);
  return bugName;
}
/**
 * 
 */
function getLastColumnIndex(sheet) {
  var lastColumn = sheet.getLastColumn();
  return lastColumn;
}
