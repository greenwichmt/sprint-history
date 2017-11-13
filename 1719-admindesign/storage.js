angular.module('services').
    service('StorageService', ["$window", function ($window) {
        var defaultExpirationMin = 60 * 24 * 10; // 10 days

        // memoryCache will be automatically cleaned up after page reload.
        var memoryCache = {};

        // expirationMin < 0 => It expires when session end
        this.set = function(key, value, expirationMin, memOnly) {
            if (memOnly) {
                memoryCache[key] =  value;
                return;
            }

            // Make sure memory cache is cleared.
            if (memoryCache[key] !== undefined) {
                delete memoryCache[key];
            }

            expirationMin = (expirationMin === undefined) ? defaultExpirationMin : expirationMin;
            if (expirationMin <= 0) {
                $window.sessionStorage.setItem(key, JSON.stringify(value));
                return;
            }

            var expirationMS = expirationMin * 60 * 1000;
            var record = {
                value: JSON.stringify(value),
                timeStamp: new Date().getTime() + expirationMS
            };

            $window.localStorage.setItem(key, JSON.stringify(record));

            return value;
        };

        this.get = function(key){
            if (memoryCache[key] !== undefined) {
                return memoryCache[key];
            }

            var record = $window.sessionStorage.getItem(key);
            if (record) {
                var value;
                try {
                    value = JSON.parse(record);
                } catch (err) {
                    window.console.log(err.toString());
                }
                return value;
            }

            try {
                record = JSON.parse($window.localStorage.getItem(key));
            } catch (err) {
                window.console.log(err.toString());
            }

            if (!record) return undefined;

            if (!record.value) return undefined;

            if (new Date().getTime() > record.timeStamp) return undefined;

            return JSON.parse(record.value);
        };

        this.remove = function(key) {
            $window.sessionStorage.removeItem(key);
            $window.localStorage.removeItem(key);
        };

        this.clear = function () {
            $window.sessionStorage.clear();
            $window.localStorage.clear();
        };

    }]);
