/*
 * toggl-stats
 *
 * Copyright 2015 Cody Hazelwood
 * Licensed under the MIT license.
 */

'use strict';

var https     = require('https'),
    util      = require('util'),
    _         = require('lodash'),
    chalk     = require('chalk'),
    Table     = require('easy-table'),
    path      = require('path'),
    api       = require('./toggl-api'),
    argv      = require('minimist')(process.argv.slice(2));

/**
 * Get a formatted version for Sunday of this week
 */
function getStartDate() {
    var d = new Date();

    d.setDate(d.getDate() - d.getDay());

    return d.toISOString().substring(0, 10);
}

/**
 * Get a formatted version of today's date
 */
function getCurrentDate() {
    return (new Date()).toISOString().substring(0, 10);
}

/**
 * Validate token and workspace
 */
function validateSettings() {
    var config, token, workspace;

    // Import JSON config file from home directory
    try {
        config = require(path.join(process.env.HOME, '.toggl-stats.json'));
    } catch (e) {
        config = {};
    }

    // Decide settings (give priority to command line args)
    token     = argv.token     || config.token;
    workspace = argv.workspace || config.workspace;

    if (!token || !workspace) {
        var error = '\n' +
            'You must provide a token or workspace ID.\n' +
            '\n' +
            '  Usage: ts --workspace=000 --token=a4d5e6f7\n' +
            '\n' +
            'Alternativly, you can create a file called .toggle-stats.json in your home directory containing "workspace" and "token".\n';

        console.error(error);
        return;
    }

    // Return the parsed settings
    return {
        token:     token,
        workspace: workspace
    };
}

/**
 * Generate a table from the provided results
 *
 * @param {object} data      Project name and total total time
 * @param {number} totalTime Total hours for all projects
 */
function generateTable(data, totalTime) {
    var table = new Table();

    // Get dates
    var startDate   = getStartDate().substr(6, 5).replace('-', '/'),
        currentDate = getCurrentDate().substr(6, 5).replace('-', '/');

    // Create header
    var header = util.format('Toggl Stats This Week (%s - %s)', currentDate, startDate);

    // Create table rows
    _.forEach(data, function (time, project) {
        table.cell('1', project);
        table.cell('2', time.toFixed(1), Table.padLeft);
        table.cell('3', (time / totalTime * 100).toFixed(0) + '%', Table.padLeft);
        table.newRow();
    });

    // Render table and remove last newline character
    var renderedTable = table.print().trim();

    // Get width
    var tableWidth = renderedTable.indexOf('\n');
    tableWidth = tableWidth > 0 ? tableWidth : renderedTable.length;

    // Create separator
    var separator = _.padRight('=', tableWidth, '=');

    // Create footer
    var footer = util.format('TOTAL %s hrs', totalTime.toFixed(1));

    // Render rows
    return [
        '',
        chalk.yellow.bold(header),
        separator,
        chalk.cyan.bold(renderedTable),
        separator,
        chalk.green.bold(footer),
        ''
    ].join('\n');
}

/**
 * Main Application
 */
function main() {
    var settings = validateSettings();

    if (settings) {
        // Get data from the Toggl API
        api.getWeeklyReport(
            settings.token,
            settings.workspace,
            getStartDate(),
            function (error, json) {
                if (error) {
                    console.error(chalk.red.bold('An error occurred:'), error.message);
                    return;
                }

                var report = JSON.parse(json);

                if (report.data) {
                    var data      = {},
                        totalTime = 0;

                    // Parse report data
                    report.data.forEach(function (record) {
                        var time    = record.totals[7] / (1000 * 60 * 60),                 // Convert to hours
                            project = record.title.client + ' - ' + record.title.project;  // Create title

                        data[project] = time;
                        totalTime    += time;
                    });

                    // Generate table
                    var table = generateTable(data, totalTime);

                    // Show table
                    console.log(table);
                }

                else {
                    console.error(chalk.red.bold('An error occurred:'), report.error.message);
                }
            }
        );
    }
}

main();
