/**
 * Initialize the ACE editors and fill the GML editor with default values.
 * @param defaultObject {object} Default JSON to use
 */
var setUpEditors = function(defaultObject) {
  // Create the gml editor
  window.gmlEditor = ace.edit("gml-editor");

  // Turn off annoying error messages about scroll blocking
  gmlEditor.$blockScrolling = Infinity;

  // Apply style points
  gmlEditor.setTheme("ace/theme/monokai");

  // Turn on JS mode
  gmlEditor.getSession().setMode("ace/mode/javascript");

  // Read only!
  gmlEditor.setReadOnly(true);

  // Don't validate (since GML isn't always valid JS)
  gmlEditor.session.setOption("useWorker", false);

  // Create the json editor
  window.jsonEditor = ace.edit("json-editor");

  // Turn off annoying error messages about scroll blocking
  jsonEditor.$blockScrolling = Infinity;

  // Listen for JSON changes
  jsonEditor.getSession().on('change', function(e) {
    // Clear incrementers
    currentSubObject = 0;
    currentSubList = 0;

    // Get values
    var jsonValue = jsonEditor.getValue(),
        convertedGml = convertJsonToDs(jsonValue);

    // Set the GML editor to the parsed output
    gmlEditor.setValue(convertedGml);

    // Clear our initial selection
    gmlEditor.clearSelection();
  });

  // Make it pretty
  jsonEditor.setTheme("ace/theme/monokai");

  // Turn on JSON mode
  jsonEditor.getSession().setMode("ace/mode/json");

  // Fill in defaults
  jsonEditor.setValue(JSON.stringify(defaultObject, undefined, 4));

  // Clear our initial selection
  jsonEditor.clearSelection();
};

/**
 * Parse an array value to GML for a ds list
 * @param array {Array} The parent array
 * @param dsName {string} The DS name
 * @param property {string} The current property name
 * @param curSubNumber {number} The current sub ds number
 */
var parseArrayValue = function(array, dsName, property, curSubNumber) {
  var outputString = '';
  
  // Keep track of the current list index
  var currentListIndex = 0;

  // Loop through the array
  for (var i = 0; i < array.length; i++) {
    var currentVal = array[i];
    if (typeof currentVal === 'string') {
      // Handle strings
      outputString += `${dsName}[| ${currentListIndex}] = "${currentVal}";\n`;
    } else if (typeof currentVal === 'number') {
      // Handle numbers
      outputString += `${dsName}[| ${currentListIndex}] = ${currentVal};\n`;
    } else if (!Array.isArray(currentVal)) {
      // Handle objects
      var curSubMapNumber = currentSubObject++;
      outputString += `\n//Create a DS map for index ${i} of the ${property} array\n`
                    + `${subDsMapName}${curSubMapNumber} = ds_map_create();\n`
                    + parseObjectToGml(currentVal, `${subDsMapName}${curSubMapNumber}`)
                    + `\n//Add sub map to the ${subDsListName}${curSubMapNumber} list\n`
                    + `${dsName}[| ${currentListIndex}] = ${subDsMapName}${curSubNumber};\n`
                    + `ds_list_mark_as_map(${dsName}, ${currentListIndex});\n\n`;
    } else if (Array.isArray(currentVal)) {
      var curSubListNumber = currentSubList++;
      outputString += `\n//Create a DS list for index ${i} of the ${property} array\n`
                    + `${subDsListName}${curSubListNumber} = ds_list_create();\n`
                    + parseArrayValue(currentVal, `${subDsListName}${curSubListNumber}`, property, curSubListNumber)
                    + `\n//Add sub list to the ${subDsListName}${curSubListNumber} list\n`
                    + `${dsName}[| ${currentListIndex}] = ${subDsListName}${curSubListNumber};\n`
                    + `ds_list_mark_as_list(${dsName}, ${currentListIndex})\n`;
    }
    currentListIndex++;
  }
  return outputString;
}

/**
 * Parses an object property of the JSON
 * @param object {object} The containing object
 * @param property {any} The property to parse
 * @param dsName {string} The name of the containing ds structure
 */
var parseObjectProperty = function(object, property, dsName) {
  var outputString = '';

  // Handle strings
  if (typeof object[property] === 'string') {
    outputString += `${dsName}[? "${property}"] = "${object[property]}";\n`;
  }
  // Handle numbers
  else if (typeof object[property] === 'number') {
    outputString += `${dsName}[? "${property}"] = ${object[property]};\n`;
  }
  // Handle objects
  else if (!Array.isArray(object[property])) {
    var curSubNumber = currentSubObject++;
    outputString += `\n//Create a DS map for the ${property} property\n`
                  + `${subDsMapName}${curSubNumber} = ds_map_create();\n`
                  + parseObjectToGml(object[property], `${subDsMapName}${curSubNumber}`)
                  + `\n//Add sub map for the ${property} property to the ${dsName} map\n`
                  + `ds_map_add_map(${dsName}, "${property}", ${subDsMapName}${curSubNumber});\n\n`;
  }
  // Handle arrays
  else if (Array.isArray(object[property])) {
    var curSubNumber = currentSubList++;
    outputString += `\n//Create a DS list for the ${property} property\n`
                 + `${subDsListName}${curSubNumber} = ds_list_create();\n`
                 + parseArrayValue(object[property], `${subDsListName}${curSubNumber}`, property, curSubNumber)
                 + `\n//Add sub list for the ${property} property to the ${dsName} map\n`
                 + `ds_map_add_list(${dsName}, "${property}", ${subDsListName}${curSubNumber})\n`;
  }

  return outputString;
}

/**
 * Parses the given JSON object and converts it GML using data structures
 * @param object {object} Valid JSON object
 * @param dsName {string} Name to use for the current data structure
 * @return {string}
 */
var parseObjectToGml = function(object, dsName) {
  var outputString = '';

  // Loop through all of the object properties
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      outputString += parseObjectProperty(object, property, dsName).replace('\n\n\n', '\n\n');
    }
  }

  // Return the output
  return outputString;
}

/**
 * Converts a valid JSON object to GML using map and list data structures
 * @param json {object} A valid JSON object
 * @return {string}
 */
var convertJsonToDs = function(json) {
  var workingJson, outputString;

  // Attempt to parse
  try {
    workingJson = JSON.parse(json);
  } catch(e) {
    // JSON is no good :(
    return '';
  }

  // Set up a map to work with
  outputString = `/* Code generated automatically from JSON using
   easy-ds */
${rootDsMapName} = ds_map_create();\n`;

  // Parse
  outputString += parseObjectToGml(workingJson, rootDsMapName);

  // Return the final output
  return outputString;
}

// Default root DS map name
var rootDsMapName = '_converted_ds',
    subDsMapName = '_sub_ds',
    subDsListName = '_sub_list',
    currentSubObject = 0,
    currentSubList = 0;

// Default JSON to show in the editor
var defaultJSON = {
  lives: 3,
  score: 100,
  player: {
    name: 'Joe',
    color: 'purple',
    items: [
      'sword',
      'hammer',
      'axe'
    ]
  }
};

// Init editors
setUpEditors(defaultJSON);