#!/usr/bin/env node
const yargs = require("yargs");
const fs = require("fs");
let myRegex = /^s\/[^\/]+\/[^\/]+\/[g|p]?$/;
yargs.nargs("e", 1);
yargs.boolean("n");
yargs.boolean("i");
yargs.nargs("f", 1);
SED();

function eOption(line, command) {
  if (!validCommand(command)) {
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

function validCommand(command) {
  if (myRegex.test(command)) return true;
  else return false;
}

function fOption(line, file) {
  let instructions;
  let newLine = line;
  if (!fileExists(file)) {
    console.log("The script file doesn't exist");
    return;
  }
  try {
    var data = fs.readFileSync(file);
    instructions = data.toString().split("\n");
  } catch (e) {
    console.log("Error:", e.stack);
  }
  for (let instruction of instructions) {
    newLine = eOption(newLine, instruction);
  }
  return newLine;
}

function saveLine(line, file) {
  fs.appendFileSync(file + "-copy", line + "\n");
}

function SED() {
  // Variables declaration
  let printable = true;
  let save = false;
  let newLine;
  let file = null;
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
  if (yargs.argv._.length > 1) {
    file = yargs.argv._[1];
    args.push({ type: "e", instructions: yargs.argv._[0] });
  } else {
    file = yargs.argv._[0];
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
    args.push({ type: "e", instructions: yargs.argv.e });
  } else if (typeof yargs.argv.e === "object") {
    for (let script of yargs.argv.e) {
      args.push({ type: "e", instructions: script });
    }
  }
  if (typeof yargs.argv.f === "string") {
    args.push({ type: "f", instructions: yargs.argv.f });
  } else if (typeof yargs.argv.f === "object") {
    for (let script of yargs.argv.f) {
      args.push({ type: "f", instructions: script });
    }
  }
  // Execute all the commands on each line
  for (let line of lines) {
    newLine = Substitute(args, line);
    if (printable === true) console.log(newLine);
    if (save === true) saveLine(newLine, file);
  }
  // Delete the old file and rename the temporary file
  if (save === true) {
    unlinkFile(file);
  }
}

function Substitute(args, line) {
  newLine = line;
  for (let arg of args) {
    if (arg.type === "e") newLine = eOption(newLine, arg.instructions);
    if (arg.type === "f") newLine = fOption(newLine, arg.instructions);
  }
  return newLine;
}

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

function unlinkFile(file) {
  fs.unlink(file, function(err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  fs.rename(file + "-copy", file, function(err) {
    if (err) throw err;
    console.log("File Renamed!");
  });
}

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
