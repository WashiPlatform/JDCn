angular.module('serc').filter('timeAgoFilter', function($filter) {
	return function (time, fullTime) {
		if (fullTime) {
			return $filter('timestampFilter')(time);
		}
		return SercJS.utils.format.timeAgo(time);
	}
});
