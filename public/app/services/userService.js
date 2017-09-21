angular.module('userService', [])
	.factory('User', function($http) {

		var userFactory = {};

		// userFactory.get = function(id) {
		// 	return $http.get('/api/users/' + id);
		// };

		// userFactory.all = function() {
		// 	return $http.get('/api/users/');
		// };

		// userFactory.create = function(userData) {
		// 	return $http.post('/api/users/create', userData);
		// };

		userFactory.register = function(userData) {
			return $http.post('/registerUser', userData);
		}

		userFactory.registerTeacher = function(userData) {
			return $http.post('/registerTeacher', userData);
		}

		// userFactory.update = function(id, userData) {
		// 	return $http.put('/api/users/' + id, userData);
		// };

		// userFactory.delete = function(id) {
		// 	return $http.delete('/api/users/' + id);
		// };

		userFactory.checkIfTeacher = function(token) {
			return $http.post('/api/users/isTeacher', token, { cache: false });
		};

		userFactory.checkIfTeacherOf = function(token, className) {
			return $http.post('/api/classes/isTeacher/' + className, token, { cache: false });
		};

		userFactory.getClassList = function(token) {
			return $http.post('/api/users/classList', token);
		}

		userFactory.getClass = function(id) {
			return $http.post('/api/classes/' + id);
		}

		userFactory.createClass = function(data) {
			return $http.post('/api/classes/createClass/', data);
		}

		userFactory.addClass = function(data) {
			return $http.post('/api/classes/addClass/', data);
		}

		return userFactory;

	});
