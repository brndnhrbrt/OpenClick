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
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	next();
});

app.use(express.static(__dirname + '/public'));

mongoose.connect(config.database); 

app.use(morgan('dev'));

var apiRoutes = require('./app/routes/api')(app, express);
app.use('/api', apiRoutes);

app.post('/registerUser', function(req, res) {
	if(req.body.username && req.body.password && req.body.name) {
		var User = require('./app/models/user');
		var user = new User();		
		user.name = req.body.name;  
		user.username = req.body.username;
		user.password = req.body.password;
		user.isTeacher = 0;
		var OCClass = require('./app/models/class');
		OCClass.findOne({ name: "Demo" }, function(err, cclass) {
			if(!err) {
				user.classList = [cclass._id];
				cclass.userList.push(user.username);
				cclass.save(function(err) {
					if(!err) {
						user.save(function(err) {
							if (err) {
								if (err.code == 11000) 
									return res.json({ success: false, message: 'A user with that username already exists. ' });
								else 
									return res.send(err);
							} else {
								res.json({ success: true, message: 'User Created' });
							}
						});
					}
				});
			} else {
				return res.json({ success: false, message: 'Whoops... Something went wrong!' });
			}
		});
	} else {
		return res.json({ success: false, message: 'Please check your user information' });
	}
});

app.post('/registerTeacher', function(req, res) {
	if(req.body.name && req.body.password && req.body.username) {
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
	} else {
		return res.json({ success: false, message: 'Please check your user information' });
	}
});

app.get('refresh', function(req, res) {
	res.send('.');
});

app.get('*', function(req, res) {
	res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.listen(config.port);
console.log('Server is running on port ' + config.port);
