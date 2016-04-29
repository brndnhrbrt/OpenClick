angular.module('mainCtrl', [])
	.controller('ccController', function(Auth, User, AuthToken, $location) {
		var vm = this;

		vm.className = "";

		vm.createClass = function() {
			console.log('Attempting to make a class');
			User.createClass({ "token": AuthToken.getToken(), "name": vm.className })
				.then(function(data) {
					$location.path('/');
				});
		}

		vm.addClass = function() {
			console.log('Attempting to make a class');
			Auth.getUser()
				.then(function(data) {
						var username = data.data.username;
						User.addClass({ "token": AuthToken.getToken(), "name": vm.className, "teacher": vm.teacherUserName, "username": username })
							.then(function(data) {
								$location.path('/');
							});
				});
		}

		vm.test = 'hellow world';
	})
	.controller('rootController', function($location, Auth, User, AuthToken) {

		var vm = this;
		vm.loggedInView = 'hide';
		vm.noUserView = 'show';
		vm.classList = [];
		vm.myClasses = [];
		vm.teacherView = 'hide';
		vm.isTeacher = 1;

		var date = new Date().getTime() / 1000;
		User.checkIfTeacher({ "token": AuthToken.getToken(), "date": date})
			.then(function(data) {
				if(data.data.isTeacher) {
					vm.isTeacher = 1;
					vm.teacherView = 'show';
				} else {
					vm.isTeacher = 0;
				}
			});

		vm.addClass = function() {
			$location.path('/addClass');
		}

		vm.createClass = function() {
			$location.path('/createClass');
		}


		vm.checkIfLoggedIn = function() {
			if(Auth.isLoggedIn()) {
				vm.loggedInView = 'show';
				vm.noUserView = 'hide';
				vm.getClasses();

				// $location.path('/click');
			}
		}

		vm.goToClass = function(className) {
			$location.path('/click/' + className);
		}

		vm.getClasses = function() {
			User.getClassList({ "token": AuthToken.getToken() })
				.then(function(data) {
					vm.classList = data.data.classList;
					vm.buildClasses();
				});
		}

		vm.buildClasses = function() {
			for(var v in vm.classList) {
				User.getClass(vm.classList[v], { "token": AuthToken.getToken() })
					.then(function(data) {
						if(data.data) {

							var myClass = {
								"name": data.data.name,
								"teacher": data.data.teacher
							};

							vm.myClasses.push(myClass);
						}
					});
			}
		}


		vm.checkIfLoggedIn();
		
	})
	.controller('mainController', function(AuthToken, $rootScope, $location, Auth, User, $http) {
		var vm = this;
		vm.loggedIn = Auth.isLoggedIn();

		$rootScope.$on('$routeChangeStart', function() {
			vm.loggedIn = Auth.isLoggedIn();	

			Auth.getUser()
				.then(function(data) {
					vm.user = data.data;
				});	
		});	

		vm.doLogin = function() {
			vm.processing = true;
			vm.error = '';
	
			Auth.login(vm.loginData.username, vm.loginData.password)
				.success(function(data) {
					vm.processing = false;	

					if(AuthToken.returnStorageMode()) {
						$location.path('/private');
					} else {
						if (data.success)			
							$location.path('/');
						else 
							vm.error = data.message;
					}						
			});
		};

		vm.doRegister = function() {
			vm.processing = true;
			vm.message = '';
			User.register(vm.registerData)
				.success(function(data) {
					vm.processing = false;
					vm.message = data.message;
					Auth.login(vm.registerData.username, vm.registerData.password)
						.success(function(data) {		
							if (data.success) {
								vm.registerData = {};
								$location.path('/');
							}
							else 
								vm.error = data.message;
					});
				});
		}

		vm.doRegisterTeacher = function() {
			vm.processing = true;
			vm.message = '';
			User.registerTeacher(vm.registerData)
				.success(function(data) {
					vm.processing = false;
					vm.message = data.message;
					Auth.login(vm.registerData.username, vm.registerData.password)
						.success(function(data) {		
							if (data.success) {
								vm.registerData = {};
								$location.path('/');
							}
							else 
								vm.error = data.message;
					});
				});
		}

		vm.doLogout = function() {
			Auth.logout();
			vm.user = '';

			$location.path('/login');
		};

		vm.createSample = function() {
			Auth.createSampleUser();
		};
});