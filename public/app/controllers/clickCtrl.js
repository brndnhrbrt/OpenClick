angular.module('clickCtrl', [])
	.controller('clickController', function(User, Auth, AuthToken, Click, $routeParams,  $location, $interval, $timeout, $window, $rootScope) {

		var vm = this;

		vm.isTeacher = false;
		vm.studentMode = 'hide';
		vm.teacherMode = 'hide';
		vm.usersAnswer = "";
		vm.answerRightView = 'hide';
		vm.answerWrongView = 'hide';
		vm.answerButtons = [];
		vm.joinRoomInterval;
		vm.deletedRoomInterval;
		vm.joinRoomIntervalAdmin;
		vm.socketIDReplaced = 'hide';
		vm.reconnect = 0;
		vm.checkMark = 'hide';
		vm.connection = 'badConnection';

		// Teacher Variables
		vm.adminButtons = 'hide';
		vm.chartView = 'hide';
		vm.dualChartView = 'hide';
		vm.deleteBtn = 'hide';
		vm.questionBtn = 'question-btn';
		vm.trashBtn = 'btn-primary';
		vm.pollBtn = 'btn-primary';
		vm.questionContainer = [];
		vm.stats = [];
		vm.firstStats = [];
		vm.pollMode = 0;
		vm.pollOption = 1;
		vm.statsMode = 0;
		vm.userCount = 1;

		// Question Variables
		vm.questionID = "";
		vm.question = {};
		vm.questionButtons = [];

		vm.activeClass = $routeParams.className;
		vm.activeTeacher = $routeParams.teacherName;

		var socket = io('http://localhost:3001', { 'force new connection': true });

		$rootScope.$on('$locationChangeStart', function (event, next, current) {
		  socket.disconnect();
		});

		if(AuthToken.returnStorageMode()) {
			$location.path('/private');
		}

		vm.submitAnswer = function(answer) {
			vm.checkMark = 'hide';
			vm.usersAnswer = answer;
			for(var a in vm.answerButtons) {
				// if(a == answer)
				// 	// vm.answerButtons[a] = 'active-btn'
				// else
					vm.answerButtons[a] = '';
			}
			vm.usersAnswer = answer;

			// Get teacher name


			var teacherName = vm.activeTeacher;

			var obj = {
				"token": AuthToken.getToken(),
				"answer": answer, 
				"classTitle": vm.activeClass,
				"teacherName": teacherName
			};

			socket.emit('submit-answer', obj);
		}

		vm.askQuestionAgain = function() {
			vm.pollMode = 0;
			vm.pollOption = 1;
			vm.firstStats = vm.stats;
			vm.stats = [];
			vm.statsMode = 1;
		}

		vm.buildFirst = function() {
			var dataTable = new google.visualization.DataTable();
		    dataTable.addColumn('string', 'Answer');
		    dataTable.addColumn('number', 'Votes');

		    var width = window.innerWidth * .7;

		     if(width < 600)
		    	var width = window.innerWidth * .9;

		     var options = {'title':'Question Results',
		      			'backgroundColor': '#FFFFFF',
		     			'titlePosition': 'none',
                       'width': width,
                       'height':200};


            var buttonStats1 = [];
			for(var b in vm.questionButtons) {
				buttonStats1[vm.questionButtons[b]] = 0;
			}
		   	for(var s in vm.stats) {
		   		buttonStats1[vm.stats[s][1]]++;
		   	}
		   	var data1 = [];
		   	for(var i in vm.questionButtons) {
		   		data1.push([
		   			vm.questionButtons[i], buttonStats1[vm.questionButtons[i]]
		   			])
		   		
		   	}

		   	var div1 = document.querySelector('div#chart1');
		    var table1 = new google.visualization.PieChart(angular.element(div1)[0]);
		    dataTable.addRows(data1);
		    table1.draw(dataTable, options);
		}

		vm.buildSecond = function() {
			var dataTable = new google.visualization.DataTable();
		    dataTable.addColumn('string', 'Answer');
		    dataTable.addColumn('number', 'Votes');

		   	var width = window.innerWidth * .7;

		   	if(width < 600)
		    	var width = window.innerWidth * .9;
		   	
		    var options = {'title':'Question Results',
		      			'backgroundColor': '#FFFFFF',
		     			'titlePosition': 'none',
                       'width': width,
                       'height':200};


            var buttonStats2 = [];
			for(var b in vm.questionButtons) {
				buttonStats2[vm.questionButtons[b]] = 0;
			}
		   	for(var s in vm.firstStats) {
		   		buttonStats2[vm.firstStats[s][1]]++;
		   	}
		   	var data2 = [];
		   	for(var i in vm.questionButtons) {
		   		data2.push([
		   			vm.questionButtons[i], buttonStats2[vm.questionButtons[i]]
		   			])
		   		
		   	}


		   	var div2 = document.querySelector('div#chart2');
		    var table2 = new google.visualization.PieChart(angular.element(div2)[0]);
		    dataTable.addRows(data2);
		    table2.draw(dataTable, options);

		}

		vm.buildDualTables = function() {
			vm.buildFirst();
			vm.buildSecond();
		    vm.chartView = 'hide';
		    vm.dualChartView = 'show';
		   	Click.refresh();

		}

		vm.buildTable = function() {
			// google.load('visualization', '1', {packages:['table']});

		    var dataTable = new google.visualization.DataTable();
		    dataTable.addColumn('string', 'Answer');
		    dataTable.addColumn('number', 'Votes');

		    var width = window.innerWidth * .7;

		    if(width < 600)
		    	var width = window.innerWidth * .9;

		   	var options = {'title':'Question Results',
		      			'backgroundColor': '#FFFFFF',
		     			'titlePosition': 'none',
                       'width': width,
                       'height':300};

		    var div = document.querySelector('div#chart');
		    var table = new google.visualization.PieChart(angular.element(div)[0]);

		    var buttonStats = [];
			for(var b in vm.questionButtons) {
				buttonStats[vm.questionButtons[b]] = 0;
			}
		   	for(var s in vm.stats) {
		   		buttonStats[vm.stats[s][1]]++;
		   	}
		   	var data = [];
		   	for(var i in vm.questionButtons) {
		   		data.push([
		   			vm.questionButtons[i], buttonStats[vm.questionButtons[i]]
		   			])
		   		
		   	}
		   	
		   	vm.chartView = 'show';
		   	Click.refresh();

		    dataTable.addRows(data);
		    table.draw(dataTable, options);
 		}

 		vm.deleteQuestion = function(id) {
 			var id = id['_id'];
 			if(vm.activeQuestionID == id)
 				vm.clearQuestion();

  			Click.deleteQuestion(id, { "token": AuthToken.getToken() });
  			Click.removeQuestion(vm.activeClass, { "question": id })
  				.then(function(data) {
  					vm.questionContainer = [];
 					vm.buildTeacherView();
  				});
		}

		// You have to emit to tell the socket to stop recording votes
		vm.pollBtnToggle = function() {
			if(vm.pollBtn == 'btn-primary') {
				vm.pollBtn = 'btn-success';
				vm.pollBtnMode = 1;
				vm.closePoll(0);
			} else {
				vm.pollBtn = 'btn-primary';
				vm.askQuestionAgain();
				vm.openPoll();
				socket.emit('resend', AuthToken.getToken());
				vm.pollBtnMode = 0;
			}
		}

		vm.closePoll = function(option) {
			if(option) {
				vm.pollMode = 1;
				vm.pollOption = 0;
			} else {
				vm.pollMode = 1;
				vm.pollOption = 1;
				vm.pollBtn = 'btn-success';
			}
			socket.emit('clear-stats', AuthToken.getToken());
			socket.emit('close-poll', { "token": AuthToken.getToken() });
		}

		vm.openPoll = function() {
			vm.pollMode = 0;
			vm.pollOption = 1;
			socket.emit('open-poll', { "token": AuthToken.getToken() });
		}

 		vm.sendAnswerToUsers = function() {
			vm.closePoll(1);
			var obj = {
				"token": AuthToken.getToken(),
				"answer": vm.question.answer
			};

			socket.emit('send-answer', obj);
		}

		vm.buildTeacherView = function() {
			var date = new Date().getTime() / 1000;
			Click.getActiveQuestion(vm.activeClass, { "date": date })
				.then(function(data) {
					vm.questionID = data.data;
					if(data.data != "") {
						Click.getQuestion(vm.questionID, { "token": AuthToken.getToken })
							.then(function(data) {
								vm.adminButtons = 'show';
								vm.question = data.data;
								vm.openPoll();
								vm.questionButtons = vm.question.choices;
								socket.emit('get-stats', AuthToken.getToken());
							});
					}
				});

			Click.getQuestions(vm.activeClass, { "teacher": vm.activeTeacher })
				.then(function(data) {
					var ids = data.data;
					for(var i in ids) {
						Click.getQuestion(ids[i], { "token": AuthToken.getToken() })
							.then(function(data) {

								var q = {
									"_id": data.data['_id'],
									"answer": data.data.answer,
									"buttonAmount": data.data.buttonAmount,
									"choices": data.data.choices,
									"type": data.data.type,
									"text": data.data.text,
									"shortText": data.data.text.slice(0, 30)
								};

								var flag = false;
								for(var j in vm.questionContainer) {
									if(vm.questionContainer[j].text == q.text)
										flag = true;
								}
								if(!flag) {
									vm.questionContainer.push(q);
								}
								
							});
					}
				});
		}

		vm.checkForDupes = function(outter, inner) {
			for(var i in outter) {
				if(outter[i] == inner)
					return true;
			}
			return false;
		}

		vm.buildView = function() {
			Click.getActiveQuestion(vm.activeClass)
				.then(function(data) {
					if(data.data != "") {
						vm.questionID = data.data;
						vm.buildStudentQuestion(data.data);
						vm.studentMode = 'show';
					}
					if(data.data == "") {
						vm.adminButtons = 'hide';
						vm.answerRightView = 'hide';
						vm.answerWrongView = 'hide';
						vm.studentMode = 'hide';
						vm.questionButtons = [];
						vm.question = {};
						vm.questionID = "";
						vm.usersAnswer = "";
					}
				});
		}

		vm.showDeleteBtn = function() {
			if(vm.trashBtn == 'btn-primary') {
				vm.trashBtn = 'btn-danger noClick';
				vm.questionBtn = 'btn-big';
				vm.deleteInterval = $timeout(function() {
				        vm.deleteBtn = 'btn-small';
				        vm.trashBtn = 'btn-danger';
				    }, 250);
			} else {
				vm.trashBtn = 'btn-primary';
				vm.questionBtn = 'question-btn';
				vm.deleteBtn = 'hide';
			}
		}

		vm.createQuestion = function() {
			vm.clearQuestion();
 			$location.path('/createQuestion/' + vm.activeClass + '/' + vm.activeTeacher);
 		}

		vm.buildStudentQuestion = function(id) {
			Click.getQuestion(id, { "token": AuthToken.getToken })
				.then(function(data) {
					vm.question = data.data;
					vm.questionButtons = vm.question.choices;
					for(var q in vm.questionButtons) {
						vm.answerButtons[vm.questionButtons[q]] = "";
					}
				});
		}

		vm.clearQuestion = function() {
			if(vm.isTeacher) {
				vm.closePoll(0);
				Click.setActiveQuestion(vm.activeClass, { "token": AuthToken.getToken(), "question": ""})
					.then(function(data) {
						socket.emit('clear-view', { "token": AuthToken.getToken() });
					});
			}
			vm.pollMode = 1;
			vm.pollOption = 1;
			vm.question = {};
			vm.chartView = 'hide';
			vm.dualChartView = 'hide';
			vm.questionID = "";
			vm.questionButtons = [];
			vm.stats = [];
			vm.statsMode = 0;
		}

		vm.sendQuestion = function(question) {
			Click.setActiveQuestion(vm.activeClass, { "token": AuthToken.getToken(), "question": question['_id']})
				.then(function(data) {
					vm.pollMode = 0;
					vm.pollOption = 1;
					vm.openPoll();
					vm.pollBtn = 'btn-primary';
					socket.emit('send-question', AuthToken.getToken());
				});
		}

		vm.initSocket = function() {

			socket.on('connect', function() {
				if(vm.reconnect) {
					socket.emit('register', AuthToken.getToken());
				}
				reconnect = 1;
			});

			socket.on('joined', function(msg) {
				console.log(msg);
				vm.connection = 'goodConnection';
				$interval.cancel(vm.joinRoomInterval);
				$interval.cancel(vm.joinRoomIntervalAdmin);
				if(vm.isTeacher) {
					// socket.emit('get-pollMode', AuthToken.getToken());
					vm.buildTeacherView();
				}
				else
					vm.buildView();
			});

			socket.on('user-replaced', function(msg) {
				vm.socketIDReplaced = 'show';
				console.log(msg);
				Click.refresh();
			});



			socket.on('send-count', function(count) {
				if(vm.isTeacher) {
					vm.userCount = count;
					Click.refresh();
				}
			});



			// this may be the issue the interval isnt being cleared



			socket.on('join-room', function(msg) {
				console.log(msg);

				Auth.getUser()
					.then(function(data) {
					var joinObj = {
						token: AuthToken.getToken(),
						classTitle: vm.activeClass,
						teacherName: data.data.username
					};
									//Start an interval to join room over and over
					vm.joinRoomIntervalAdmin = $interval(function() {
						socket.emit('join-room', joinObj);
					}, 200);
				});
			});

			socket.on('room-deleted', function(msg) {
				console.log(msg);

				vm.connection = 'badConnection';


				var teacherName = vm.activeTeacher
				var joinObj = {
					token: AuthToken.getToken(),
					classTitle: vm.activeClass,
					teacherName: teacherName
				};

				vm.joinRoomInterval = $interval(function() {
					socket.emit('join-room', joinObj);
				}, 2000);

			});

			socket.on('register-request', function() {
				console.log('requested to register');
				socket.emit('register', AuthToken.getToken());
			});

			socket.on('registered', function() {
				console.log('You are now registered');
				if(vm.isTeacher) {
					//create and join

					Click.getClassUserList(vm.activeClass, { "token": AuthToken.getToken() })
						.then(function(data) {

							var list = data.data.userList;

							var obj = {
								"token": AuthToken.getToken(),
								"classTitle": vm.activeClass,
								"classRoster": list
							};

							console.log(list);

							socket.emit('create-room', obj);
						});
				} else {
					//join room

					var teacherName = vm.activeTeacher;
					var joinObj = {
						token: AuthToken.getToken(),
						classTitle: vm.activeClass,
						teacherName: teacherName,
						reconnect: vm.reconnect
					};

					vm.reconnect = 0;

					vm.joinRoomInterval = $interval(function() {
						socket.emit('join-room', joinObj);
					}, 2000);

				}
			});

			socket.on('send-stats', function(stats) {
				var superFlag = false;
				for(var i in stats) {
					var flag = false;
					var stat = stats[i];
					for(var j in vm.answerButtons) {
						if(j == stat[1])
							flag = true;
					}
					if(!flag)
						superFlag = true;
				}

				if(!superFlag) {
					vm.stats = stats;
					if(stats.length)
						vm.buildTable();
				} else {
					console.log('Error with stats');
				}
			});

			socket.on('resend', function() {
				for(var i in vm.answerButtons) {
					vm.answerButtons[i] = '';
				}
				Click.refresh();
			});

			socket.on('recieved-vote', function(vote) {
				// vm.checkMark = 'show';
				Click.refresh();
				vm.answerButtons[vote] = 'active-btn';
				console.log('Your vote has been recieved by the teacher');
			});

			socket.on('send-stat', function(username, answer) {
				socket.emit('recieved-vote', { "name": username, "className": vm.activeClass });

				if(vm.isTeacher && vm.pollMode == 0 && vm.pollOption == 1) {
					var flag = false;
					for(var s in vm.stats) {
						if(vm.stats[s][0] == username) {
							flag = true;
							vm.stats[s][1] = answer;
						}
					}
					if(!flag)
						vm.stats.push([username, answer]);

					if(vm.statsMode)
						vm.buildDualTables();
					else
						vm.buildTable();
				}
			});

			socket.on('recieve-answer', function(answer) {
				vm.activeAnswer = answer;
				if(vm.activeAnswer == vm.usersAnswer) {
					vm.answerRightView = 'show';
					vm.answerWrongView = 'hide';
				}
				else {
					vm.answerWrongView = 'show';
					vm.answerRightView = 'hide';
				}

				Click.refresh();
			});

			// socket.on('pollMode', function(mode) {
			// 	console.log(mode);
			// 	vm.pollMode = mode;
			// 	vm.pollOption = 1;
			// });

			socket.on('get-active', function() {
				if(vm.isTeacher)
					vm.buildTeacherView();
				else
					vm.buildView();
			});

			socket.on('clear-view', function() {
				vm.adminButtons = 'hide';
				// vm.checkMark = 'hide';
				vm.answerRightView = 'hide';
				vm.answerWrongView = 'hide';
				vm.studentMode = 'hide';
				vm.questionButtons = [];
				vm.question = {};
				vm.questionID = "";
				vm.usersAnswer = "";
				if(vm.isTeacher)
					vm.buildTeacherView();
				else
					vm.buildView();
			});

			socket.on('welcome-back', function(msg) {
				console.log(msg);
				$interval.cancel(vm.joinRoomInterval);
				$interval.cancel(vm.joinRoomIntervalAdmin);
				vm.connection = 'goodConnection';
			});

			socket.on('disconnect', function() {
				vm.connection = 'badConnection';
				vm.userCount = 1;
				console.log('You have disconnected from the socket');
				Click.refresh();
			});

			socket.on('message', function(msg) {
				console.log(msg);
			});

		}

		var date = new Date().getTime() / 1000;
		User.checkIfTeacherOf({ 'token': AuthToken.getToken(),  "date":  date}, vm.activeClass)
			.then(function(data) {

				// console.log(data);

				if(data.data.isTeacher) {
					vm.isTeacher = true;
					vm.studentMode = 'hide';
					vm.teacherMode = 'show';
					vm.buildTeacherView();
				} else {
					vm.studentMode = 'show';
					vm.teacherMode = 'hide';
					vm.buildView();
				}
				vm.initSocket();
			});

	})
	.controller('questionController', function(AuthToken, Click, $location, $routeParams) {

		var vm = this;
		vm.activeClass = $routeParams.className;
		vm.activeTeacher = $routeParams.teacherName;

		vm.buttons = [];
			vm.buttonResults = [];
			vm.createQuestionData = [];
			vm.createQuestionChoices = [];

			vm.buttonCount = 0;
			vm.choiceCount = 0;
			vm.createQuestionMFAnswer = 0;

			vm.questionType = 'NULL';
			vm.createQuestionTypeMC = 'show';
			vm.createQuestionTypeTF = 'hide';
			vm.createQuestionData.type = 'MC';
			vm.createQuestionTFAnswer = 'True';
			vm.createQuestionShowMCAnswerBtn = 'hide';
			vm.createQuestionType = 'Multiple Choice';
			vm.createQuestionTypeColor = 'btn-primary';
			vm.createQuestionTFAnswerColor = 'btn-success';

		vm.SwitchType = function() {
			if(vm.createQuestionType == 'Multiple Choice') {
				vm.createQuestionData.type = 'TF';
				vm.createQuestionShowMCAnswerBtn = 'hide';
				vm.createQuestionData.choices = [ "True", "False"];
				vm.createQuestionData.buttonAmount = 2;
				vm.createQuestionChoices = [];
				vm.choiceCount = 0;
				vm.createQuestionType = 'True or False';
				vm.createQuestionTypeColor = 'btn-success';
				vm.createQuestionTypeMC = 'hide';
				vm.createQuestionTypeTF = 'show';
			} else {
				vm.createQuestionData.type = 'MC';
				vm.createQuestionMFAnswer = "";
				vm.createQuestionData.choices = [];
				vm.createQuestionShowMCAnswerBtn = 'hide';
				vm.createQuestionData.buttonAmount = 0;
				vm.createQuestionType = 'Multiple Choice';
				vm.createQuestionTypeColor = 'btn-primary';
				vm.createQuestionTypeMC = 'show';
				vm.createQuestionTypeTF = 'hide';
			}
		}

		vm.SwitchTFAnswer = function() {
			if(vm.createQuestionTFAnswer == 'True') {
				vm.createQuestionData.answer = 'False';
				vm.createQuestionTFAnswer = 'False';
				vm.createQuestionTFAnswerColor = 'btn-danger';
			} else {
				vm.createQuestionData.answer = 'True';
				vm.createQuestionTFAnswer = 'True';
				vm.createQuestionTFAnswerColor = 'btn-success';
			}
		}

		vm.addChoice = function() {
			vm.createQuestionShowMCAnswerBtn = 'show';
			vm.createQuestionChoices.push(vm.choiceCount);
			vm.choiceCount++;
			vm.createQuestionData.buttonAmount = vm.choiceCount;
		}

		vm.SwitchMFAnswer = function(current) {
			var tmp;
			var flag = false;
			var hardFlag = false;
			var newCurrent;
			var count = 0;
			for(var i in vm.createQuestionChoices) {

				if(flag) {
					newCurrent = vm.createQuestionChoices[i];
					flag = false;
					hardFlag = true;
				}
				if(count == 0)
					tmp = i;

				if(vm.createQuestionChoices[i] == current)
					flag = true;

				count++;
			}
			if(!hardFlag)
				newCurrent = vm.createQuestionChoices[tmp]

			vm.createQuestionMFAnswer = newCurrent;
			vm.createQuestionData.answer = vm.createQuestionData.choices[newCurrent];

		}

		vm.registerQuestion = function() {
			if(typeof vm.createQuestionData.answer == 'undefined') {
				vm.createQuestionData.answer =  vm.createQuestionData.choices[0];
			}

			var choices = [];
			for(var i in vm.createQuestionData.choices) {
				choices.push(vm.createQuestionData.choices[i]);
			}

			var obj = {
					"text": vm.createQuestionData.text,
					"answer": vm.createQuestionData.answer,
					"type": vm.createQuestionData.type,
					"buttonAmount": vm.createQuestionData.buttonAmount,
					"choices": choices
				}
				// "classTitle": vm.activeClass }
			Click.submitQuestion({ "question": obj, "token": AuthToken.getToken() })
				.then(function(data){
					Click.addQuestionToClass({ "question": data.data.id, "classTitle": vm.activeClass, "token": AuthToken.getToken() })
						.then(function(data){
							$location.path('/click/' + vm.activeClass + '/' + vm.activeTeacher);
						});
				});
			
		}
	});
