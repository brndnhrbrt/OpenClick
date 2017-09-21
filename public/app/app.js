angular.module('userApp', ['ngAnimate', 'app.routes', 'authService', 'mainCtrl', 'clickCtrl', 'userService', 'clickService'])
	.config(function($httpProvider) {
		$httpProvider.interceptors.push('AuthInterceptor');
});