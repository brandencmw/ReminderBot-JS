function SyntaxError(errorMessage) {
  this.message = errorMessage;
  this.name = "Syntax Error";
}

function DateError(errorMessage) {
  this.message = errorMessage;
  this.name = "Date Error";
}

module.exports = {
  SyntaxError,
  DateError,
};
