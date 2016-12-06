"use strict";
var diff = require("diff");
function doDiff() {
    var oldStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation";
    var newStr = "George Washington was a general on the rebel side during the Independence war, and was later elected the first president of the USA";
    var difference = diff.diffWords(oldStr, newStr);
    console.log(difference);
}
doDiff();
function doPatch() {
    var oldStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation";
    var newStr = "George Washington was a general on the American side during the American war of Independence, and later became the first president of the resulting nation. He served for two terms, and died at the age of 67 in 1799.";
    var patch = diff.createPatch("", oldStr, newStr, "", "");
    var outStr = diff.applyPatch(oldStr, patch);
    console.log(outStr);
}
doPatch();
