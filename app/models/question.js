var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var QuestionSchema = new Schema({
	text: String,
	answer: String,
	type: String,
	buttonAmount: Number,
	choices: [String]
});

module.exports = mongoose.model('Question', QuestionSchema);