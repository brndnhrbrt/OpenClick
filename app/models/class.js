var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var OCClassSchema = new Schema({
	name: String,
	questionList: [String],
	userList: [String],
	logList: [String],
	activeQuestion: String,
	teacher: String
});

module.exports = mongoose.model('OCClass', OCClassSchema);