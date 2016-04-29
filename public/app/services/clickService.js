angular.module('clickService', [])
	.factory('Click', function($http, $q) {

		var clickFactory = {};

		clickFactory.getQuestions = function(className, teacherName) {
			return $http.post('/api/classes/getQuestions/' + className, teacherName, { cache: false });
		};

		clickFactory.getQuestion = function(id, token) {
			return $http.post('/api/questions/' + id, token, { cache: false });
		}

		clickFactory.refresh = function() {
			return $http.get('/refresh/');
		}

		clickFactory.submitQuestion = function(questionData) {
			return $http.post('/api/questions/create', questionData);
		}

		clickFactory.deleteQuestion = function(id, token) {
			return $http.post('/api/questions/delete/' + id, token);
		};

		clickFactory.addQuestionToClass = function(data) {
			return $http.post('/api/classes/addQuestion/', data);
		}

		clickFactory.removeQuestion = function(name, data) {
			return $http.post('/api/classes/removeQuestion/' + name, data);
		}

		clickFactory.getActiveQuestion = function(className, date) {
			return $http.post('/api/classes/getActive/' + className, date, { cache: false });
		}

		clickFactory.setActiveQuestion = function(className, data) {
			return $http.post('/api/classes/setActive/' + className, data);
		}

		clickFactory.getClassUserList = function(className, data) {
			return $http.post('/api/classes/getUserList/' + className, data);
		}

		clickFactory.getTeacherName = function(className) {
			return $http.get('/api/classes/getTeacherName/' + className);
		}


		return clickFactory;

	});