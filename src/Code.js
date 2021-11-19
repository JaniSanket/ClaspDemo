////////////// Kanbanize Global Variables ////////////////
Logger.log("Hello");
const apiUrl = 'https://cloudd8.kanbanize.com/index.php/api/kanbanize/';
const apiKey_kanban = '84xJL5je9la2AjhoZxJuNorV6R3iFhvZo6ax653k';

//////////////////////////////////////////////////////////

function myConfig(){
  var variables = {    
    bigQueryProject: 'cloudiq-global-services-01'
  };
  return variables;
}

function test(){
    //projectsData = parseSimpleResults(getProjects());
    projectsDataJson = JSON.stringify(projectsData);
    //Logger.log(projectsDataJson);
}

function doGet2(e) { 
    
  var template = HtmlService.createTemplateFromFile('workflow');

  //var plData = getPLData();

  //projectsDataJson = JSON.stringify(plData);

  //template.projectsData = projectsDataJson;
  return template.evaluate();     
  
}

function doGet(e) {
 
  if(e.parameter.project_id != null){
    
    var template = HtmlService.createTemplateFromFile('Project');
    var projectId = e.parameter.project_id;

    var projectData = getProjectData(projectId);
    
    template.projectFields = projectData.projectFields[0];


    template.currentActions = projectData.currentActions;
    template.nextActions = projectData.nextActions;
    template.resources = projectData.resources;

    //Logger.log(projectData.projectFields);
    return template.evaluate();   
    
  }else {
      if(e.parameter.gantt_view != null){
        var template = HtmlService.createTemplateFromFile('GanttView');        
      }else{
        var template = HtmlService.createTemplateFromFile('Index');
      }

      //projectsData = parseSimpleResults(getProjects());
      //projectsDataJson = JSON.stringify(projectsData); 
  
      var plData = getPLData();
     
      projectsDataJson = JSON.stringify(plData);
  
      template.projectsData = projectsDataJson;
      return template.evaluate();     
  }
}
 
function getPLData(){
  var plData = {}; 

  plData.projectsData = getSheetData("Projects!A2:Q");
  plData.actionsData = getSheetData("Actions(Demo)!A2:J");
  plData.resourcesData = getSheetData("Projects!A2:H");

  var aID = getSheetData("Actions(Demo)!B:B");
  var lastAID = aID[aID.length-1];
  plData.lastActionId = lastAID[0];

  //////

  var url = apiUrl + 'get_projects_and_boards//format/json';
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
      "apikey" : apiKey_kanban,
      "cache-control": "no-cache"
    }
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());
  var boards_data = final_data.projects[0].boards;
  var boards_name = [];
  var boards_id = [];
  for (let i = 0; i < boards_data.length; i++){
    boards_name.push(boards_data[i].name);
    boards_id.push(boards_data[i].id);
  }
  Logger.log(boards_name);
  plData.boardsName = boards_name;

  var taskname_list = [];
  var taskdec_list = [];
  var taskcolor_list = [];
  for (let i = 0; i < boards_id.length; i++){
    var url = apiUrl + 'get_all_tasks//format/json';
    var data = {"boardid":boards_id[i]};
    var payload = JSON.stringify(data);
    var options = {
      'muteHttpExceptions': true,
      'method' : 'post',
      'contentType': 'application/json',
      "headers" : {
        "apikey" : apiKey_kanban,
        "cache-control": "no-cache"
      },
      "payload" : payload
    };
    var response = UrlFetchApp.fetch(url,options);
    var task_data = JSON.parse(response.getContentText());
    Logger.log(task_data);
    var task_name = []; 
    var task_dec = [];
    var task_color = [];
    for (let i = 0; i < task_data.length; i++){
      task_name.push(task_data[i].title);
      task_dec.push(task_data[i].description);
      task_color.push(task_data[i].color);
    }
    taskname_list.push(task_name);
    taskdec_list.push(task_dec);
    taskcolor_list.push(task_color);
  }
  plData.taskName = taskname_list;
  plData.taskDec = taskdec_list;
  plData.taskColor = taskcolor_list;
  return plData;

}

function getSheetData(rangeString) {
  var range = Sheets.Spreadsheets.Values.get("1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY", rangeString);
  var values = range.values;
  return values;
}

function parseSimpleResults(results) {
  var names = results.schema.fields.map(function(field){ return field.name; });
  return results.rows.map(function(row) {
    var obj = {};
    for( var i = 0, len = names.length; i < len; ++i ) {
      obj[names[i]] = row.f[i].v;
    }
    return obj;
  });
}

/*
function getProjects(){

  
  var projectsQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Projects] as Projects ' + 
    'JOIN  [cloudiq-global-services-01.project_lifecycle.Actions] as Actions ' + 
    'ON Projects.Project_ID = Actions.Project_ID ' + 
    'JOIN  [cloudiq-global-services-01.project_lifecycle.Resources] as Resources ' + 
    'ON Projects.Project_ID = Resources.Project_ID';

//var projectsQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Projects] as Projects where Project_ID is not null';
   


  var projectsData = runQuery(projectsQuery);
  //Logger.log(projectsData);
  return projectsData;
}
*/

function getJsonArrayFromData(data)
{

  var obj = {};
  var result = [];
  var headers = data[0];
  var cols = headers.length;
  var row = [];

  for (var i = 1, l = data.length; i < l; i++)
  {
    // get a row to fill the object
    row = data[i];
    // clear object
    obj = {};
    for (var col = 0; col < cols; col++) 
    {
      // fill object with new values
      obj[headers[col]] = row[col];    
    }
    // add object in a final result
    result.push(obj);  
  }

  return result;  

}

//deprecated
function getProjectData(projectId) {
  
  var projectData = {};
  
  var projectQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Projects] where Project_ID = ' + projectId;
  projectData.projectFields = runQuery(projectQuery);

  var currentActionsQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Actions] where Project_ID = ' + projectId +
  ' and Action_Status = "ACTIVE" order by Start_Date limit 3';
  projectData.currentActions = runQuery(currentActionsQuery);

  var nextActionsQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Actions] where Project_ID = ' + projectId +
    ' and Action_Status = "NOT_STARTED" order by Start_Date limit 3';
  projectData.nextActions = runQuery(nextActionsQuery);

  var resourcesQuery = 'SELECT * FROM [cloudiq-global-services-01.project_lifecycle.Resources] where Project_ID = ' + projectId;  
  projectData.resources = runQuery(resourcesQuery);

  //Logger.log(projectData.projectFields); 

  return projectData; 
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

/**
 * Runs a BigQuery query and logs the results in a spreadsheet.

function runQuery(sql) {

  Logger.log(sql);
  // Needed to access tables that are synced to sheets
  DriveApp.getRootFolder();

  var projectId = myConfig().bigQueryProject;

  var request = {
    query: sql  
  };

  var queryResults = BigQuery.Jobs.query(request, projectId);
  var jobId = queryResults.jobReference.jobId;

  // Check on status of the Query Job.
  var sleepTimeMs = 100;
  while (!queryResults.jobComplete) {
    Utilities.sleep(sleepTimeMs);
    sleepTimeMs *= 2;
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
  }

  // Get all the rows of results.
  var rows = queryResults.rows;
  while (queryResults.pageToken) {
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId, {
      pageToken: queryResults.pageToken
    });
    rows = rows.concat(queryResults.rows);
  }

  //Logger.log("Results");

  //Logger.log(queryResults);

  return(queryResults);

  //Logger.log("Rows:");
  //Logger.log(rows);

  if (rows) {
   
    var headers = queryResults.schema.fields.map(function(field) {
      return field.name;
    });
    
   // Append the results to data return object
    var data = new Array(rows.length);
    for (var i = 0; i < rows.length; i++) {
      var cols = rows[i].f;
      data[i] = new Array(cols.length);
      for (var j = 0; j < cols.length; j++) {
        data[i][j] = cols[j].v;
      }
    }

    //Logger.log(data);  
    
    Logger.log('Results outputted');
    return data;    
  } else {
    Logger.log('No rows returned.');
  }
}
 */

//////////////Full Edit and Date and precentage complete Edit///////////////

function putRow(project_Id,poject_title,start_date,end_date,poject_duration,poject_depends,poject_showIt,poject_complete,poject_summary,poject_motivation,poject_type,poject_lifecycle,poject_priority,poject_program,poject_status,poject_notes,poject_stackholder){
  try{
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=771651836";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Projects");
    var lastRow = webAppSheet.getLastRow();
    for(var i = 2; i <= lastRow; i++){
      if (webAppSheet.getRange(i,1).getValue() == project_Id){
        webAppSheet.getRange('B'+i+':Q'+i).setValues([[start_date,end_date,poject_duration,poject_type,poject_title,poject_lifecycle,poject_motivation,poject_summary,poject_complete,poject_depends,poject_showIt,poject_priority,poject_program,poject_status,poject_notes,poject_stackholder]])
      }
    }
    }catch(e){
      console.log(e);
  }
}

//////////////////////Motivation Edit////////////////////

function putMotivation(pID,pMotivation){
  try{
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=771651836";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Projects");
    var lastRow = webAppSheet.getLastRow();
    for(var i = 2; i <= lastRow; i++){
      if (webAppSheet.getRange(i,1).getValue() == pID){
        webAppSheet.getRange('H'+i).setValue(pMotivation)
      }
    }
    }catch(e){
      console.log(e);
  }
}

//////////////////////Status Summary Edit////////////////////

function putStatusSummary(pID,pSummary){
  try{
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=771651836";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Projects");
    var lastRow = webAppSheet.getLastRow();
    for(var i = 2; i <= lastRow; i++){
      if (webAppSheet.getRange(i,1).getValue() == pID){
        webAppSheet.getRange('I'+i).setValue(pSummary)
      }
    }
    }catch(e){
      console.log(e);
  }
}

//////////////////////Resources Edit////////////////////

function putResources(pID,pType,pLifecycle){
  try{
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=771651836";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Projects");
    var lastRow = webAppSheet.getLastRow();
    for(var i = 2; i <= lastRow; i++){
      if (webAppSheet.getRange(i,1).getValue() == pID){
        webAppSheet.getRange('E'+i).setValue(pType)
        webAppSheet.getRange('G'+i).setValue(pLifecycle)
      }
    }
    }catch(e){
      console.log(e);
  }
}

//////////////////////Actions Edit////////////////////

function putActions(currentId,currentAction,currentOwner){
  try{
    //  var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=576336423";
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=1558924749";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Actions(Demo)");
    var lastRow = webAppSheet.getLastRow();
    for(var i = 2; i <= lastRow; i++){
      var temp = webAppSheet.getRange('B'+i).getValue();
      
      if (temp == currentId){
        webAppSheet.getRange('F'+i).setValue(currentAction);
        webAppSheet.getRange('J'+i).setValue(currentOwner);
      }
    }
    
    }catch(e){
      console.log(e);
  }
}

//////////////////////Actions Add////////////////////

function addActions(proId,aID,sA_date,eA_date,actionDuration,actionName,actionType,actionLink,actionOwner,actionDepends,actionNotes,actionStatus){
  try{
    var url = "https://docs.google.com/spreadsheets/d/1yTa9oeptN5vMC6a_RYd0Y9g6f9159mvDeMjdz7wTnfY/edit#gid=1558924749";
    var ss = SpreadsheetApp.openByUrl(url);
    var webAppSheet = ss.getSheetByName("Actions(Demo)");
    // var lastRow = webAppSheet.getLastRow();
    // var actionID = lastRow;
    webAppSheet.appendRow([proId,aID,sA_date,eA_date,actionDuration,actionName,actionStatus,actionType,actionLink,actionOwner,actionDepends,actionNotes]);
    }catch(e){
      console.log(e);
  }
}

////////////////////// Kanban Create Parent and Child and Link them ////////////////////

function kanbanFirst(kanban_board,kanban_PName,kanban_CName,kanban_Pcolumn,kanban_Plane,kanban_Ccolumn,kanban_Clane,kanban_Passign,kanban_Cassign,kanban_Pcolor,kanban_Ccolor,kanban_Pdec,kanban_Cdec,kanban_Ppriority,kanban_Cpriority,kanban_Pdead,kanban_Cdead,kanban_PsubtaskArray,kanban_CsubtaskArray,kanban_Ptag,kanban_Ctag,kanban_Psize,kanban_Csize,kanban_Pextlink,kanban_Cextlink){

  var pcolor = kanban_Pcolor.substring(1);
  var ccolor = kanban_Ccolor.substring(1);

  ///// Get Board ID //////

  var url = apiUrl + 'get_projects_and_boards//format/json';
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
       "apikey" : apiKey_kanban,
       "cache-control": "no-cache"
     }
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());
  var temp = final_data;
  var boards_data = temp.projects[0].boards;
  for (let i = 0; i < boards_data.length; i++){
    if(kanban_board == boards_data[i].name){
      var boardID = boards_data[i].id;

      /////////////////// Parent /////////////////////

      var url = apiUrl + 'create_new_task//format/json';
      var data = {"boardid":boardID, "title":kanban_PName,"lane":kanban_Plane,"assignee":kanban_Passign,"color":pcolor,"description":kanban_Pdec,"priority":kanban_Ppriority,"deadline":kanban_Pdead,"tags":kanban_Ptag,"size":kanban_Psize,"extlink":kanban_Pextlink};
      var payload = JSON.stringify(data);
      var options = {
        'muteHttpExceptions': true,
        'method' : 'post',
        'contentType': 'application/json',
        "headers" : {
          "apikey" : apiKey_kanban,
          "cache-control": "no-cache"
        },
        "payload" : payload
      };
      var response = UrlFetchApp.fetch(url,options);

      var url = apiUrl + 'get_all_tasks//format/json';
      var data = {"boardid":boardID};
      var payload = JSON.stringify(data);
      var options = {
        'muteHttpExceptions': true,
        'method' : 'post',
        'contentType': 'application/json',
        "headers" : {
          "apikey" : apiKey_kanban,
          "cache-control": "no-cache"
        },
        "payload" : payload
      };
      var response = UrlFetchApp.fetch(url,options);
      var final_data = JSON.parse(response.getContentText());

      var globVar
      for (let i = 0; i < final_data.length; i++){
        // Logger.log(data[i]);
        if (final_data[i].title == kanban_PName){
          globVar = final_data[i].taskid;
          var url = apiUrl + 'move_task//format/json';
          var data = {"boardid":boardID, "taskid":globVar, "column":kanban_Pcolumn};
          var payload = JSON.stringify(data);
          var options = {
            'muteHttpExceptions': true,
            'method' : 'post',
            'contentType': 'application/json',
            "headers" : {
              "apikey" : apiKey_kanban,
              "cache-control": "no-cache"
            },
            "payload" : payload
          };
          var response = UrlFetchApp.fetch(url,options);
          // Logger.log(response);
          Logger.log(final_data[i].taskid);
        }
      }
      
      const kanban_Psubtask = kanban_PsubtaskArray.split(",");
      console.log(kanban_Psubtask);
      for (let i = 0; i < kanban_Psubtask.length; i++){
        var url = apiUrl + 'add_subtask//format/json';
        var data = {"taskparent":globVar, "title":kanban_Psubtask[i]};
        var payload = JSON.stringify(data);
        var options = {
          'muteHttpExceptions': true,
          'method' : 'post',
          'contentType': 'application/json',
          "headers" : {
            "apikey" : apiKey_kanban,
            "cache-control": "no-cache"
          },
          "payload" : payload
        };
        var response = UrlFetchApp.fetch(url,options);
        Logger.log(response);
      }

      /////////////////// Child /////////////////////
      
      var url = apiUrl + 'create_new_task//format/json';
      var data = {"boardid":boardID, "title":kanban_CName,"lane":kanban_Clane,"assignee":kanban_Cassign,"color":ccolor,"description":kanban_Cdec,"priority":kanban_Cpriority,"deadline":kanban_Cdead,"tags":kanban_Ctag,"size":kanban_Csize,"extlink":kanban_Cextlink};
      var payload = JSON.stringify(data);
      var options = {
        'muteHttpExceptions': true,
        'method' : 'post',
        'contentType': 'application/json',
        "headers" : {
          "apikey" : apiKey_kanban,
          "cache-control": "no-cache"
        },
        "payload" : payload
      };
      var response = UrlFetchApp.fetch(url,options);

      var url = apiUrl + 'get_all_tasks//format/json';
      var data = {"boardid":boardID};
      var payload = JSON.stringify(data);
      var options = {
        'muteHttpExceptions': true,
        'method' : 'post',
        'contentType': 'application/json',
        "headers" : {
          "apikey" : apiKey_kanban,
          "cache-control": "no-cache"
        },
        "payload" : payload
      };
      var response = UrlFetchApp.fetch(url,options);
      var final_data = JSON.parse(response.getContentText());

      var globVarchild
      for (let i = 0; i < final_data.length; i++){
        // Logger.log(data[i]);
        if (final_data[i].title == kanban_CName){
          globVarchild = final_data[i].taskid;

          var url = apiUrl + 'edit_link//format/json';
          var data = {"taskid":globVar, "action":"set", "linkedid":globVarchild, "type":"parent"};
          var payload = JSON.stringify(data);
          var options = {
            'muteHttpExceptions': true,
            'method' : 'post',
            'contentType': 'application/json',
            "headers" : {
              "apikey" : apiKey_kanban,
              "cache-control": "no-cache"
            },
            "payload" : payload
          };
          var response = UrlFetchApp.fetch(url,options);

          var url = apiUrl + 'move_task//format/json';
          var data = {"boardid":boardID, "taskid":globVarchild, "column":kanban_Ccolumn};
          var payload = JSON.stringify(data);
          var options = {
            'muteHttpExceptions': true,
            'method' : 'post',
            'contentType': 'application/json',
            "headers" : {
              "apikey" : apiKey_kanban,
              "cache-control": "no-cache"
            },
            "payload" : payload
          };
          var response = UrlFetchApp.fetch(url,options);
          // Logger.log(response);
          Logger.log(final_data[i].taskid);
        }
      }

      const kanban_Csubtask = kanban_CsubtaskArray.split(",");
      console.log(kanban_Csubtask);
      for (let i = 0; i < kanban_Csubtask.length; i++){
        var url = apiUrl + 'add_subtask//format/json';
        var data = {"taskparent":globVarchild, "title":kanban_Csubtask[i]};
        var payload = JSON.stringify(data);
        var options = {
          'muteHttpExceptions': true,
          'method' : 'post',
          'contentType': 'application/json',
          "headers" : {
            "apikey" : apiKey_kanban,
            "cache-control": "no-cache"
          },
          "payload" : payload
        };
        var response = UrlFetchApp.fetch(url,options);
        Logger.log(response);
      }
    }
  }
}

////////////////////// Kanban Edit Cards ////////////////////

function kanbanEdit(kanban_board,kanbanCards,kanban_editTitle,kanban_editdec,kanban_editcolor){

  var card_color = kanban_editcolor.substring(1);

  var url = apiUrl + 'get_projects_and_boards//format/json';
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
       "apikey" : apiKey_kanban,
       "cache-control": "no-cache"
     }
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());
  var temp = final_data;
  var boards_data = temp.projects[0].boards;
  var board_ID;
  for (let i = 0; i < boards_data.length; i++){
    if(kanban_board == boards_data[i].name){
      board_ID = boards_data[i].id;
    }
  }

  var url = apiUrl + 'get_all_tasks//format/json';
  var data = {"boardid":board_ID};
  var payload = JSON.stringify(data);
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
      "apikey" : apiKey_kanban,
      "cache-control": "no-cache"
    },
    "payload" : payload
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());

  var card_ID;
  for (let i = 0; i < final_data.length; i++){
    if(kanbanCards == final_data[i].title){
      card_ID = final_data[i].taskid;
    }
  }

  var url = apiUrl + 'edit_task//format/json';
  var data = {"boardid":board_ID, "taskid":card_ID, "title":kanban_editTitle, "description":kanban_editdec,"color":card_color};
  var payload = JSON.stringify(data);
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
      "apikey" : apiKey_kanban,
      "cache-control": "no-cache"
    },
    "payload" : payload
  };
  var response = UrlFetchApp.fetch(url,options);

}

////////////////////// Kanban Delete Cards ////////////////////

function kanbanDelete(kanban_board,kanbanCards){

  var url = apiUrl + 'get_projects_and_boards//format/json';
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
       "apikey" : apiKey_kanban,
       "cache-control": "no-cache"
     }
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());
  var temp = final_data;
  var boards_data = temp.projects[0].boards;
  var board_ID;
  for (let i = 0; i < boards_data.length; i++){
    if(kanban_board == boards_data[i].name){
      board_ID = boards_data[i].id;
    }
  }

  var url = apiUrl + 'get_all_tasks//format/json';
  var data = {"boardid":board_ID};
  var payload = JSON.stringify(data);
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
      "apikey" : apiKey_kanban,
      "cache-control": "no-cache"
    },
    "payload" : payload
  };
  var response = UrlFetchApp.fetch(url,options);
  var final_data = JSON.parse(response.getContentText());

  var card_ID;
  for (let i = 0; i < final_data.length; i++){
    if(kanbanCards == final_data[i].title){
      card_ID = final_data[i].taskid;
    }
  }

  var url = apiUrl + 'delete_task//format/json';
  var data = {"boardid":board_ID, "taskid":card_ID};
  var payload = JSON.stringify(data);
  var options = {
    'muteHttpExceptions': true,
    'method' : 'post',
    'contentType': 'application/json',
    "headers" : {
      "apikey" : apiKey_kanban,
      "cache-control": "no-cache"
    },
    "payload" : payload
  };
  var response = UrlFetchApp.fetch(url,options);

}

