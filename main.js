const nearley = require("nearley");
const grammar = require("./grammar.js");
const mathjax = require("mathjax");

// MathJax configuration
MathJax.Hub.Config({
  TeX: {
    Macros: {
      RR: "{\\bf R}",
      bold: ["{\\bf #1}", 1]
    }
  },
  tex2jax: {
    inlineMath: [["$", "$"]]
  }
});

// Parse function for the equals-key
function parse(str) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
    return parser.results;
  } catch (e) {
    return "Syntax Error";
  }
}

const calculator = document.querySelector(".calculator");
const keys = calculator.querySelector(".calculator_keys");
const display = document.querySelector(".calculator_display");
// Collects Tex-Input after every buttonpress on the calculator so that the Mathjax rendering can be updated
let displayRaw = document.querySelector("#texInput");
let dispRender = null; // Global definition of so that the following localized variable assignment writes into the global scope
// Assignment of the dispRender variable:
MathJax.Hub.Queue(function() {
  dispRender = MathJax.Hub.getAllJax("display")[0];
});

function updateRenderDisplay(newContent) {
  displayRaw.value += newContent;
  MathJax.Hub.Queue(["Text", dispRender, displayRaw.value]);
  console.log(displayRaw.value);
}

keys.addEventListener("click", event => {
  const key = event.target;
  const action = key.dataset.action;

  if (key.matches("button")) {
    if (!action) {
      updateRenderDisplay(key.textContent);
    } else {
      if (key.className === "operator") {
        // display.textContent += action;
        updateRenderDisplay(action);
      }
      if (action === "decimal") {
        // display.textContent += ".";
        updateRenderDisplay(".");
      }
      if (action === "clear") {
        // display.textContent = "";
        displayRaw.value = "";
        MathJax.Hub.Queue(["Text", dispRender, displayRaw.value]);
      }
      if (action === "frac") {
        // display.textContent += "$1 \\over 2$";
        updateRenderDisplay("{\\frac {} {}}");
      }
      if (action === "calculate") {
        displayRaw.value = parse(displayRaw.value);
        MathJax.Hub.Queue(["Text", dispRender, displayRaw.value]);
      }
    }
  }
});

displayRaw.addEventListener("input", event => {
  updateRenderDisplay("")
})
