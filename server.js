var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config');
var path = require('path');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	// res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

app.use(express.static(__dirname + '/public'));

mongoose.connect(config.database); 

// app.use(morgan('dev'));

var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

app.post('/registerUser', function(req, res) {
	var User = require('./app/models/user');
	var user = new User();		
	user.name = req.body.name;  
	user.username = req.body.username;
	user.password = req.body.password;
	user.isTeacher = 0;
	user.classList = ["5720deba70b7956e0b9d3cfb"];

	user.save(function(err) {
		if (err) {
			if (err.code == 11000) 
				return res.json({ success: false, message: 'A user with that username already exists. '});
			else 
				return res.send(err);
		} else {
			var OCClass = require('./app/models/class');
			OCClass.findOne({_id: "5720deba70b7956e0b9d3cfb" }, function(err, cclass) {
				cclass.userList.push(user.username);
				cclass.save(function(err) {
				});
			});
		}
	});
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.post('/registerTeacher', function(req, res) {
	var User = require('./app/models/user');
	var user = new User();		
	user.name = req.body.name;  
	user.username = req.body.username;
	user.password = req.body.password;
	user.isTeacher = 1;

	user.save(function(err) {
		if (err) {
			if (err.code == 11000) 
				return res.json({ success: false, message: 'A user with that username already exists. '});
			else 
				return res.send(err);
		}
	});
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.get('refresh', function(req, res) {
	res.send('.');
});

app.get('*', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.listen(config.port);
console.log('Server is running on port ' + config.port);
