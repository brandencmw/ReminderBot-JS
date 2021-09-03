// Defines a syntax error commited by the user
function SyntaxError(errorMessage) {
  this.message = errorMessage;
  this.name = "Syntax Error";
}

// Defines a date error commited by the user
function DateError(errorMessage) {
  this.message = errorMessage;
  this.name = "Date Error";
}

// Export errors to be used in other modules
module.exports = {
  SyntaxError,
  DateError,
};
