/// <reference path="../typings/index.d.ts"/>
import diff = require("diff");

function doDiff() {
  let oldStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation";
  let newStr = "George Washington was a general on the rebel side during the Independence war, and was later elected the first president of the USA";
  let difference = diff.diffWords(oldStr, newStr);
  console.log(difference);
}
doDiff();

function doPatch() {
    let oldStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation";
    let newStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation. He served for two terms, and died at the age of 67 in 1799.";
    let patch = diff.createPatch("", oldStr, newStr, "", "");
    let outStr = diff.applyPatch(oldStr, patch);
    console.log(outStr);
}
doPatch();
