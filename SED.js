#!/usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
let myRegex = /^s\/[^\/]+\/[^\/]+\/[g|p]?$/;
let fileRegex = /^[^\/]+\.[^\/]+/;
// Define yargs keys with their respective conditions
yargs.nargs("e", 1);
yargs.boolean("n");
yargs.nargs("i", 1);
yargs.nargs("f", 1);
multipleFiles();

//Function for trying a command on a line
function eOption(line, command) {
  if (!validCommand(command)) {
    console.log("Unknown command entered! :(");
    process.exit();
  }
  let commandList = command.split("/");
  let oldWord = commandList[1];
  let newWord = commandList[2];
  let flag = commandList[3];
  let regObj = new RegExp(oldWord);
  if (flag === "g") regObj = new RegExp(oldWord, "g");
  let newLine = line.replace(regObj, newWord);
  if (flag === "p" && newLine !== line) console.log(newLine);
  return newLine;
}
// Validate each command
function validCommand(command) {
  if (myRegex.test(command)) return true;
  else return false;
}
//Get all the commands from the script file
function fOption(file, args) {
  let instructions;
  if (!fileExists(file)) {
    console.log("The script file doesn't exist");
    return;
  }
  try {
    var data = fs.readFileSync(file);
    instructions = data.toString().split("\n");
  } catch (e) {
    console.log("Error:", e.stack);
    return;
  }
  for (let instruction of instructions) {
    args.push(instruction);
  }
  return;
}

function multipleFiles() {
  if (fileRegex.test(yargs.argv._[0])) {
    console.log("no e option");
    for (let file of yargs.argv._) {
      SED(file, false);
    }
    return;
  } else if (myRegex.test(yargs.argv._[0])) {
    console.log("e option");
    for (let file of yargs.argv._.slice(1)) {
      SED(file, true);
    }
  }
}

// Save line to the chosen file
function saveLine(line, file) {
  fs.appendFileSync(file + "-copy", line + "\n");
}
// "MAIN"
function SED(file, noEOption) {
  // Variables declaration
  let printable = true;
  let save = false;
  let newLine;
  let args = [];
  let lines;
  // The n option was used, don't print.
  if (!(yargs.argv.n === undefined)) printable = false;
  // The i option was used, don't print an edit the file.
  if (!(yargs.argv.i === undefined)) {
    printable = false;
    save = true;
  }
  // If the length is greater than 1, the e option was called
  if (noEOption === true) {
    args.push(yargs.argv._[0]);
  }
  // Check if file exists
  if (!fileExists(file)) {
    console.log("File does not exist!");
    return;
  }
  // Read the file into an array
  lines = readFile(file);
  // Get all the commands from each e and f option entered
  if (typeof yargs.argv.e === "string") {
    args.push(yargs.argv.e);
  } else if (typeof yargs.argv.e === "object") {
    for (let script of yargs.argv.e) {
      args.push(script);
    }
  }
  if (typeof yargs.argv.f === "string") {
    fOption(yargs.argv.f, args);
  } else if (typeof yargs.argv.f === "object") {
    fOption(file, args);
  }
  //Create backup file if needed
  if (save === true && !(yargs.argv.i === "")) {
    let backUp = file + "." + yargs.argv.i;
    fs.copyFileSync(file, backUp);
  }
  // Execute all the commands on each line
  for (let line of lines) {
    newLine = substitute(args, line);
    if (printable === true) console.log(newLine);
    if (save === true) saveLine(newLine, file);
  }
  // Delete the old file and rename the temporary file
  if (save === true) {
    unlinkFile(file);
  }
}
//Try every command on a line
function substitute(args, line) {
  newLine = line;
  for (let arg of args) {
    newLine = eOption(newLine, arg);
  }
  return newLine;
}
// For reading... the file
function readFile(file) {
  try {
    var data = fs.readFileSync(file);
    let lines = data.toString().split("\n");
    return lines;
  } catch (e) {
    console.log("Error:", e.stack);
    return;
  }
}
// Delete old file and rename the temporary file
function unlinkFile(file) {
  fs.unlink(file, function(err) {
    if (err) throw err;
  });
  fs.rename(file + "-copy", file, function(err) {
    if (err) throw err;
  });
}
// Checking file integrity :)
function fileExists(file) {
  try {
    if (fs.existsSync(file)) {
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
}
