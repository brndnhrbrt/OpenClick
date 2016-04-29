var socketApp = require('express')();
var jwt = require('jsonwebtoken');
var User = require('./app/models/user');
var mongoose = require('mongoose');
var http = require('http').Server(socketApp);
var io = require('socket.io')(http);
var config = require('./config');

var classList = [];
var clientList = [];
var disconnectList = [];
var voteList = [];

mongoose.connect(config.database); 

io.on('connection', function(socket) {

	socket.emit('register-request');

	// THIS NOW WORKS!!!
	User.find({}, function(err, users) {
		// console.log(users);
	});

	// console.log('user has connected');

	socket.on('disconnect', function() {
		// Start an interval to delete a room
		var username;
		for(var i in clientList) {
			if(socket.id == clientList[i].socketID) {
				username = clientList[i].name;
			}
		}

		var intervalID;
		for(var i in classList) {
			if(username == classList[i].creator) {
				intervalID = setTimeout(function() {

					//tell every user they are being disconnected

					if(classList[i]) {
						for(var c in classList[i].activeUsers) {
							var user = classList[i].activeUsers[c];
							for( var j in clientList) {
								if(user == clientList[j].name) {
									if(io.sockets.connected[clientList[j].socketID])
										io.sockets.connected[clientList[j].socketID].emit('room-deleted', 'You have left the room');
								}
							}
						}
						classList.splice(i, 1);
					}

					// clearTimeout(myVar);

				}, 10000000);
			}
		}

		if(username && intervalID) {
			var obj = {
				"name": username,
				"intervalID": intervalID
			};

			disconnectList.push(obj);
		}

		// Delete the user from the active list of its class
		for(var c in classList) {
			for(var i in classList[c].activeUsers) {
				if(username == classList[c].activeUsers[i]) {
					classList[c].activeUsers.splice(i, 1);

					var count = 0;
					for(var k in classList[c].activeUsers)
						count++;

					if(io.sockets.connected[classList[c].creatorSocketID])
						io.sockets.connected[classList[c].creatorSocketID].emit('send-count', count);
				}
			}
		}
	});

	// This will register the user and add it to the client list
	socket.on('register', function(token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				//Check if the user is already part of the clientList
				var username = decoded.username;
				var flag = false;

				var user = {
					"name": username,
					"socketID": socket.id
				};

				if(!flag) {
					clientList.push(user);
				}

				socket.emit('registered');
				var d = new Date(); // for now
				console.log(username + ' has connected @ ' + d.getHours() + ':' + d.getMinutes() );

				for(var i in disconnectList) {
					if(decoded.username == disconnectList[i].name) {
						clearTimeout(disconnectList[i].intervalID);
					}
				}
			}
		});
	});

	socket.on('create-room', function(data) {
		var token = data.token;
		var classTitle = data.classTitle;
		var classRoster = data.classRoster;
		jwt.verify(token, config.secret, function(err, decoded) {


			//Destroy any old rooms
			for(var i in classList) {
				if(classList[i].creator == decoded.username) {
					for(var j in classList[i].activeUsers) {
						var user = classList[i].activeUsers[j];
						for(var c in clientList) {
							if(user == clientList[c].name) {
								if(io.sockets.connected[clientList[c].socketID]) 
									io.sockets.connected[clientList[c].socketID].emit('room-deleted', 'You have left the room');

							}
						}
					}
					classList.splice(i, 1);
				}
			}

			if(!err) {
				var myClass = {
					name: classTitle,
					classRoster: classRoster,
					creator: decoded.username,
					creatorSocketID: socket.id,
					UID: '|' + classTitle + '|' + decoded.username + '|',
					stats: [],
					pollMode: 1,
					activeUsers: []
				};

				// Check if the class UID is a duplicate
				var flag = false;
				for(var c in classList) {
					if(myClass.UID == classList[c].UID) {
						classList[c].creatorSocketID = socket.id;
						flag = true;
					}
				}

				if(!flag) {
					classList.push(myClass);
					socket.emit('join-room', 'Room created');
				} else {
					socket.emit('join-room', 'Room created');
				}
			}
		});
	});

	// This will allow the user to join a room
	socket.on('join-room', function(data) {
		var token = data.token;
		var classTitle = data.classTitle;
		var teacherName = data.teacherName;

		var UID = '|' + classTitle + '|' + teacherName + '|';

		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {

				//leave any old active user
				for(var i in classList) {
					for(var j in classList[i].activeUsers) {
						if(classList[i].activeUsers[j] == decoded.username)
							classList[i].activeUsers.splice(j, 1);
					}
				}


				for(var i in classList) {
					if(UID == classList[i].UID) {

						// Check to see if the user is already an active user
						var flag = false;
						for(var c in classList[i].activeUsers) {
							if(decoded.username == classList[i].activeUsers[c])
								flag = true;
						}

						var secondFlag = false;
						for(var c in classList[i].classRoster) {
							if(decoded.username == classList[i].classRoster[c])
								secondFlag = true;
						}

						if(secondFlag && !flag && !data.reconnect) { 
							classList[i].activeUsers.push(decoded.username);

							var count = 0;
							for(var j in classList[i].activeUsers)
								count++;

							if(io.sockets.connected[classList[i].creatorSocketID]) 
								io.sockets.connected[classList[i].creatorSocketID].emit('send-count', count);

							socket.emit('joined', 'You have joined ' + UID);
						} 

						if(flag) {
							var count = 0;
							for(var j in classList[i].activeUsers)
								count++;

							if(io.sockets.connected[classList[i].creatorSocketID]) 
								io.sockets.connected[classList[i].creatorSocketID].emit('send-count', count);
							socket.emit('welcome-back', 'You have reconnected to the room');
						}

					}
				}
			}
		});
	});

	socket.on('send-answer', function(data) {
		var token = data.token;
		var answer = data.answer;
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var c in classList) {
					if(classList[c].creator == decoded.username) {
						for(var a in classList[c].activeUsers) {
							var username = classList[c].activeUsers[a];
							for(var i in clientList) {
								if(username == clientList[i].name) {
									if(io.sockets.connected[clientList[i].socketID])
										io.sockets.connected[clientList[i].socketID].emit('recieve-answer', answer);
								}
							}
						}
					}
				}
			}
		});
	});

	socket.on('clear-view', function(data) {
		var token = data.token;
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var c in classList) {
					if(classList[c].creator == decoded.username) {
						for(var a in classList[c].activeUsers) {
							var username = classList[c].activeUsers[a];
							for(var i in clientList) {
								if(username == clientList[i].name) {
									if(io.sockets.connected[clientList[i].socketID])
										io.sockets.connected[clientList[i].socketID].emit('clear-view');
								}
							}
						}
					}
				}
			}
		});
	});

	socket.on('resend', function(token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var c in classList) {
					if(decoded.username == classList[c].creator) {
						for(var i in classList[c].activeUsers) {
							var user = classList[c].activeUsers[i];

							for(var cl in clientList) {
								if(user == clientList[cl].name) {
									if(io.sockets.connected[clientList[cl].socketID])
										io.sockets.connected[clientList[cl].socketID].emit('resend');
								}
							}
						}
					}
				}
			}
		});
	});

	socket.on('clear-stats', function(token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(decoded.username == classList[i].creator) {
						classList[i].stats = [];
						socket.emit('message', 'stats are cleared');
					}
				}
			}
		});
	});

	socket.on('get-stats', function(data) {
		var token = data;
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(classList[i].creator == decoded.username) {
						socket.emit('send-stats', classList[i].stats);
					}
				}
			}
		});
	});

	socket.on('close-poll', function(data) {
		var token = data.token;
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(classList[i].creator == decoded.username) {
						classList[i].pollMode = 1;
					}
				}
			}
		});
	});

	socket.on('open-poll', function(data) {
		var token = data.token;
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(classList[i].creator == decoded.username) {
						classList[i].pollMode = 0;
					}
				}
			}
		});
	});

	socket.on('submit-answer', function(data) {
		var answer = data.answer;
		var token = data.token;
		var classTitle = data.classTitle;
		var teacherName = data.teacherName;

		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				var username = decoded.username;
				for(var c in classList) {
					if(classList[c].creator == teacherName) {
						io.sockets.connected[socket.id].emit("message", "sent");

						if(!classList[c].pollMode) {
							var stat = {
								0: username,
								1: answer 
							};

							var flag = false;
							for(var j in classList[c].stats) {
								if(classList[c].stats[j][0] == username) {
									classList[c].stats[j][1] = answer;
									flag = true;
								}
							}
							if(!flag)
								classList[c].stats.push(stat);
						}

						if(io.sockets.connected[classList[c].creatorSocketID]) {
							voteList.push({ "name": username, "className": classTitle, "socketID": socket.id, "answer": answer });
							io.sockets.connected[classList[c].creatorSocketID].emit("send-stat", username, answer);
						}
						
					}
				}

			}
		});
	});

	socket.on('recieved-vote', function(data) {
		var voteIndex;
		for(var i in voteList) {
			if(voteList[i].name == data.name && voteList[i].className == data.className) {
				voteIndex = i;
			}
		}

		if(voteIndex) {
			if(io.sockets.connected[voteList[voteIndex].socketID]) {
				io.sockets.connected[voteList[voteIndex].socketID].emit("recieved-vote", voteList[voteIndex].answer);
			}
			voteList.splice(voteIndex, 1);
		}
	});


	socket.on('send-question', function(token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(classList[i].creator == decoded.username) {
						for(var j in classList[i].activeUsers) {
							var classUser = classList[i].activeUsers[j];
							for(var cl in clientList) {
								if(clientList[cl].name == classUser) {
									var socketID = clientList[cl].socketID;
									if(io.sockets.connected[socketID]) {
										io.sockets.connected[socketID].emit('get-active');
									}
								}
							}		
						}
					}
				}
			}
		});
	});

	socket.on('get-count', function(token) {
		jwt.verify(token, config.secret, function(err, decoded) {
			if(!err) {
				for(var i in classList) {
					if(decoded.username == classList[i].creator) {
						var count = 0;
						for(var j in classList[i].activeUsers)
							count++;

						socket.emit('send-count', count);
					}
				}
			}
		});
	});

});

http.listen(config.socketPort, function() {
	console.log('Socket is up on port ' + config.socketPort);
});