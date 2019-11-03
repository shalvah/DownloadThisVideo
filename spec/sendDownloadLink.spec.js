'use strict';
require('dotenv').config({path: '.env.test'});

const { createSnsEvent } = require("./support/utils");

const { mockCache, mockTwitterAPI, mockMetrics, mockNotifications } = require("./support/mocks");
const cache = mockCache();
mockMetrics();
mockNotifications();
const requests = mockTwitterAPI();

const sendDownloadLink = require('../handler').sendDownloadLink;

describe("sendDownloadLink", () => {

    describe("when correct input", () => {

        beforeEach(function () {
            cache.flushallAsync();
        });

        it("properly chunks SNS events", () => {
            return sendDownloadLink(createSnsEvent(350), {})
                .then(response => {
                    expect(response.body).toMatch('Processed 300 tasks');
                }).catch(error => {
                    expect(requests.length).toEqual(4);
                });
        });
    });

});
