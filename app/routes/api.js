var bodyParser = require('body-parser'); 
var User = require('../models/user');
var OCClass = require('../models/class');
var Question = require('../models/question');
var jwt = require('jsonwebtoken');
var config = require('../../config');
var superSecret = config.secret;

module.exports = function(app, express) {

	var apiRouter = express.Router();

	// General
	apiRouter.get('/', function(req, res) {
		res.json({ message: 'This is the api.' });	
	});

	// Authentication
	apiRouter.post('/authenticate', function(req, res) {
		if (req.body.password) {
		  User.findOne({
		    username: req.body.username
		  }).select('name username password').exec(function(err, user) {

		    if (err) 
		    	throw err;

		  	if (!user) {
		      res.json({ 
		      	success: false, 
		      	message: 'Authentication failed. Wrong Username or Password' 
		    	});
		    } else if (user) {

		      var validPassword = user.comparePassword(req.body.password);
		      if (!validPassword) {
		        res.json({ 
		        	success: false, 
		        	message: 'Authentication failed. Wrong Username or Password' 
		      	});
		      } else {

		        var token = jwt.sign({
		        	name: user.name,
		        	username: user.username
		        }, superSecret, {
		          expiresInMinutes: 1440
		        });

		        res.json({
		          success: true,
		          message: 'Here is your token.',
		          token: token
		        });
		      }  
		    } 
		  });
	} else {
		res.json({
			success: false,
			message: 'No password provided.'
		});
	}
	});

	apiRouter.use(function(req, res, next) {
	  var token = req.body.token || req.query.token || req.headers['x-access-token'];

	  if (token) {
	    jwt.verify(token, superSecret, function(err, decoded) {      
	      if (err) {
	        res.status(403).send({ 
	        	success: false, 
	        	message: 'Failed to authenticate token.' 
	    	});  	   
	      } else { 
	        req.decoded = decoded;
	        next(); 
	      }
	    });
	  } else {
   	 	res.status(403).send({ 
   	 		success: false, 
   	 		message: 'No token provided.' 
   	 	});
	  }
	});

	// Question
	apiRouter.route('/questions/getAll')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						if(user.isTeacher) {
		    							Question.find({}, function(err, questions) {
											if (err) 
												res.send(err);

											res.json(questions);
										});
		    						} else
		    							return res.json({ "message": "Access denied" });
		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});

	apiRouter.route('/questions/create')
		.post(function(req, res) {

			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						if(user.isTeacher) {
		    							var question = new Question();		
										question.text = req.body.question.text;  
										question.answer = req.body.question.answer;
										question.type = req.body.question.type;
										question.buttonAmount = req.body.question.buttonAmount;
										question.choices = req.body.question.choices;
										question.save(function(err) {
											if (err) {
												return res.send(err);
											}

											res.json({ message: 'Question created!', id: question['_id'] });
										});
		    						} else
		    							return res.json({ "message": "Access denied" });
		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});


	apiRouter.route('/questions/:question_id')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(token) {
			  	jwt.verify(token, superSecret, function(err, decoded) {      
			     	if (err) {
				        res.status(403).send({ 
				        	success: false, 
				        	message: 'Failed to authenticate token.' 
				    	});  	   
					} else { 
				        req.decoded = decoded;
				        User.findOne({ username: decoded.username }, function(err, user) {

				        	if(err)
				        		res.json({
				        			success: false,
				        			message: 'User not found.'
				        		});
				        	
				        	if(user.isTeacher) {
				        		Question.findById(req.params.question_id, function(err, question) {
									if (err)
										res.send(err);

									res.json(question);
								});
				        	} else {
				        		Question.findById(req.params.question_id, function(err, question) {
									if (err)
										res.send(err);
									if(question) {
										question.answer = "";
										res.json(question);
									}
								});
				        	}
				        });
			      	}
			    });
			} else {
		   		res.status(403).send({ 
		   	 		success: false, 
		   	 		message: 'No token provided.' 
		   	 	});
			}
		});

	apiRouter.route('/questions/delete/:question_id')
		.post(function(req, res) {

			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						if(user.isTeacher) {
		    							
		    							Question.remove({
											_id: req.params.question_id
										}, function(err, question) {
											if (err) 
												res.send(err);
											else
												res.json({ message: 'Successfully deleted' });
										});

		    						} else
		    							return res.json({ "message": "Access denied" });
		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});














	// Users
	apiRouter.route('/users/isTeacher/:username')
		.get(function(req, res) {
			User.findOne({ username: req.params.username }, function(err, user) {
				if(!err) {
					if(user) {
						res.json(user.isTeacher);
					}
				}
			});
		});

	apiRouter.route('/classes/isTeacher/:class_name')
		.post(function(req, res) {


			var token = req.body.token || req.query.token || req.headers['x-access-token'];
			jwt.verify(token, superSecret, function(err, decoded) { 
			  	if(!err) {

			  		OCClass.findOne({ name: req.params.class_name, teacher: decoded.username }, function(err, occlass) {
						if(!err) {

							var username = decoded.username;

			  						User.findOne({ username: username }, function(err, user) {

			  							if(user.isTeacher) {
			  								if(occlass.teacher == username) {
			  									res.json({ isTeacher: 1});
			  								} else {
			  									res.json({ isTeacher: 0});
			  								}
			  							} else {
			  								res.json({ isTeacher: 0 });
			  							}
			  						});
			  				} else
								return res.send(err);
						});
			  	} else
			  		return res.send(err);
			  });
		});

	apiRouter.route('/users/isTeacher')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(token) {
			  	jwt.verify(token, superSecret, function(err, decoded) {      
			     	if (err) {
				        res.status(403).send({ 
				        	success: false, 
				        	message: 'Failed to authenticate token.' 
				    	});  	   
					} else { 
				        req.decoded = decoded;
				        User.findOne({ username: decoded.username }, function(err, user) {
				        	if(err)
				        		res.json({
				        			success: false,
				        			message: 'User not found.'
				        		});
				        	if(user)
				        		res.json({ 'isTeacher' : user.isTeacher, "date": new Date().getTime() / 1000  });
				        });
			      	}
			    });
			} else {
		   		res.status(403).send({ 
		   	 		success: false, 
		   	 		message: 'No token provided.' 
		   	 	});
			}

		});

	apiRouter.route('/users/classList')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(token) {
			  	jwt.verify(token, superSecret, function(err, decoded) {      
			     	if (err) {
				        res.status(403).send({ 
				        	success: false, 
				        	message: 'Failed to authenticate token.' 
				    	});  	   
					} else { 
				        req.decoded = decoded;
				        User.findOne({ username: decoded.username }, function(err, user) {
				        	if(err)
				        		res.json({
				        			success: false,
				        			message: 'User not found.'
				        		});
				        	if(user)
				        		res.json({ 'classList' : user.classList });
				        });
			      	}
			    });
			} else {
		   		res.status(403).send({ 
		   	 		success: false, 
		   	 		message: 'No token provided.' 
		   	 	});
			}

		});


	apiRouter.route('/classes/removeQuestion/:class_name')
		.post(function(req, res){
			OCClass.findOne({ name: req.params.class_name }, function(err, occlass){
				if(err)
					res.send(err);

				var index = occlass.questionList.indexOf(req.body.question);
				if(index > -1)
					occlass.questionList.splice(index, 1);

				occlass.save(function(err){
					if(err)
						res.send(err);

					res.json({ message: 'Question removed.' });
				});
			});
		});

	
	apiRouter.route('/classes/addQuestion/')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						if(user.isTeacher) {
		    							



		    							OCClass.findOne({ name: req.body.classTitle }, function(err, occlass){
											if(err)
												res.send(err);

											occlass.questionList.push(req.body.question);
											occlass.save(function(err){
												if(err)
													res.send(err);

												res.json({ message: 'Question added.' });
											});
										});












		    							
		    						} else
		    							return res.json({ "message": "Access denied" });
		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});

	apiRouter.route('/classes/getQuestions/:class_name')
		.post(function(req, res) {
			 OCClass.findOne({ name: req.params.class_name, teacher: req.body.teacher })
			 	.select('questionList').exec(function(err, occlass) {
	  				if(err)
	  					res.send(err);
	  				res.json(occlass.questionList);
	  			});
		});	

	apiRouter.route('/classes/getActive/:class_name')
		.post(function(req, res) {
			OCClass.findOne({ name: req.params.class_name })
				.select('activeQuestion').exec(function(err, occlass) {
					if(err)
						res.send(err)
					res.json(occlass.activeQuestion);
				});
		});

	apiRouter.route('/classes/setActive/:class_name')
		.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						if(user.isTeacher) {
		    							
		    							OCClass.findOne({ name: req.params.class_name })
											.select('activeQuestion').exec(function(err, occlass) {
												if(err) 
													res.send(err)
												else {
													jwt.verify(req.body.token, config.secret, function(err, decoded) {
														if(!err) {
															User.findOne({ username: decoded.username }, function(err, user) {
																if(user.isTeacher) {

																	occlass.activeQuestion = req.body.question;
																	occlass.save(function(err) {
																		if(err)
																			res.send(err)

																		res.json({ message: 'Active question set' });
																	});
																}
															});
														}
													});
												}
											});
		    							
		    						} else
		    							return res.json({ "message": "Access denied" });
		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});


	apiRouter.route('/classes/getUserList/:class_id')
		.post(function(req, res) {

			jwt.verify(req.body.token, config.secret, function(err, decoded) {
				if(err)
					return res.send(err);

				OCClass.findOne({ name: req.params.class_id, teacher: decoded.username }, function(err, occlass) {

					if(err)
						return res.send(err);

					if(occlass) {
						res.json({ "userList": occlass.userList });
					} else 
						return res.json({"message": "class not found"});

				});
			});
		});

	apiRouter.route('/classes/getTeacherName/:class_id')
		.get(function(req, res) {
			OCClass.findOne({ name: req.params.class_id }, function(err, occlass) {
				if (err)
					res.send(err);
				else if(occlass)
					res.json(occlass.teacher);
				else
					res.json({ "message": "Class not found" });
			});
		});

	apiRouter.route('/classes/addClass/')
		.post(function(req, res) {
			var token = req.body.token;

			jwt.verify(req.body.token, config.secret, function(err, decoded) {
					if(!err) {
						var username = req.body.username;
						var className = req.body.name;
						var teacher = req.body.teacher;

						OCClass.findOne({ name: className, teacher: teacher }, function(err, occlass) {
							if(err)
								return res.send(err)

							if(!occlass)
								return res.json({ "message": "Class not found" });

							var flag = false;
							for(var i in occlass.userList) {
								if(username == occlass.userList[i])
									flag = true;
							}

							if(!flag) {
								occlass.userList.push(username);
								occlass.save(function(err) {
									if(err)
										return res.send(err);
									User.findOne({ username: username }, function(err, user) {
									if(err)
										return res.send(err);

									if(!user)
										return res.json({ "message": "User not found" });

									user.classList.push(occlass['_id']);
									user.save(function(err) {
										if(err)
											return res.send(err);

										return res.json({ "message": "You are signed up!" });
									});

								});


								});
							} else
								return res.json({ "message": "You are already in that class" });

						});
					} else
						return res.send(err);
				});
		});

	apiRouter.route('/classes/createClass/')
		.post(function(req, res) {
			var token = req.body.token;

			jwt.verify(req.body.token, config.secret, function(err, decoded) {
					if(!err) {


						User.findOne({ username: decoded.username }, function(err, user) {
							if(err) {
								return res.send(err);
							} else {
								if(user.isTeacher) {

									var occlass = new OCClass();		
									occlass.name = req.body.name;  
									occlass.teacher = decoded.username;
									occlass.questionList = [];
									occlass.userList = [decoded.username];
									occlass.logList = [];
									
									occlass.save(function(err) {
										if (err) {
											return res.send(err);
										}

										User.findOne({username: decoded.username}, function(err, user) {
											if(err) {
												return res.send(err);
											} else {
												user.classList.push(occlass['_id']);
												user.save(function(err) {
													if(err)
														return res.send(err);
													else
														res.json({ message: 'Class created!' });
												})
											}
										});
									});


									
								}
							}
						});
					}
				});

		});


	apiRouter.route('/classes/:class_id')
			.post(function(req, res) {
			var token = req.body.token || req.query.token || req.headers['x-access-token'];

			if(!token)
				return res.json({ "message": "Token not found" });

	  		if (token) {
	    		jwt.verify(token, superSecret, function(err, decoded) { 
	    			if(!err) {
		    			User.findOne({ username: decoded.username }, function(err, user) {
		    				if(!err) {
		    					if(user) {
		    						

		    						var flag = false;
		    						for(var i in user.classList) {
		    							if(user.classList[i] == req.params.class_id)
		    								flag = true;
		    						}

		    						if(flag) {
		    							OCClass.findById(req.params.class_id, function(err, occlass) {
											if (err)
												res.send(err);

											res.json(occlass);
										});
		    						} else {
		    							res.send("You dont have permission to view this!");
		    						}



		    					} else 
		    						return res.json({ "message": "Your token does not link to a user account" });
		    				} else 
		    					return res.send(err);
		    			});
		    		} else
		    			return res.send(err);
	    		});
	    	}
		});

	














	apiRouter.get('/me', function(req, res) {
		res.send(req.decoded);
	});


	return apiRouter;
};
