/*
 * toggl-stats
 *
 * Copyright 2015 Cody Hazelwood
 * Licensed under the MIT license.
 */

'use strict';

var https = require('https'),
    util  = require('util');

/**
 * Get chunked data via HTTPS request
 * @param {object}   request  Request options
 * @param {function} callback Callback when request is complete
 */
function _getData(request, callback) {
    var data = '';
    var req = https.request(request, function (res) {
        res.on('data', function (d) {
            data += d;
        });

        res.on('end', function () {
            callback(null, data);
        });
    });

    req.end();

    req.on('error', function (e) {
        callback(e);
    });
}

module.exports = {

    /**
     * Get Weekly Report
     *
     * @param {string}   token     Toggl API Token
     * @param {string}   workspace Toggl Workspace ID
     * @param {string}   startDate Start date in the format YYYY-MM-DD
     * @param {function} callback  Provides errors or api data
     */
    getWeeklyReport: function (token, workspace, startDate, callback) {
        var url = '/reports/api/v2/weekly?user_agent=toggl-stats&workspace_id=%s&since=%s';
        var get = {
            hostname: 'toggl.com',
            path:     util.format(url, workspace, startDate),
            method:   'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            auth: util.format('%s:api_token', token)
        };

        _getData(get, callback);
    }

};
