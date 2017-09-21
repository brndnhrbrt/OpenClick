angular.module('app.routes', ['ngRoute'])
	.config(function($routeProvider, $locationProvider) {
		$routeProvider
			.when('/', {
				templateUrl: 'app/views/pages/home.html',
				controller: 'rootController',
				controllerAs: 'root'
			})
			.when('/login', {
				templateUrl: 'app/views/pages/login.html',
	   			controller: 'mainController',
	    		controllerAs: 'login'
			})
			.when('/click', {
				templateUrl: 'app/views/pages/click.html',
				controller: 'clickController',
				controllerAs: 'click'
			})
			.when('/click/:className/:teacherName', {
				templateUrl: 'app/views/pages/click.html',
				controller: 'clickController',
				controllerAs: 'click'
			})
			.when('/createClass', {
				templateUrl: 'app/views/pages/createClass.html',
				controller: 'ccController',
				controllerAs: 'cc'
			})
			.when('/addClass', {
				templateUrl: 'app/views/pages/addClass.html',
				controller: 'ccController',
				controllerAs: 'cc'
			})
			.when('/createQuestion/:className/:teacherName', {
				templateUrl: 'app/views/pages/createQuestion.html',
				controller: 'questionController',
				controllerAs: 'question'
			})
			.when('/register', {
				templateUrl: 'app/views/pages/register.html',
				controller: 'mainController',
	    		controllerAs: 'register'
			})
			.when('/registerTeacher', {
				templateUrl: 'app/views/pages/registerTeacher.html',
				controller: 'mainController',
	    		controllerAs: 'register'
			})
			.when('/private', {
				templateUrl: 'app/views/pages/private.html',
			})
			.when('/:templatePath*', {
				templateUrl: 'app/views/pages/404.html'
			});

	$locationProvider.html5Mode(true);
});
