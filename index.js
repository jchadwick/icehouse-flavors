/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/

'use strict';
const Alexa = require('alexa-sdk');
const cheerio = require('cheerio');
const rp = require('request-promise');

const SKILL_NAME = 'Yardley Ice House Flavors';

const getFlavors = () =>
    rp({
        uri: `http://www.yardleyicehouse.com/`,
        transform: (body) => cheerio.load(body)
    })
        .then($ => $('#side-nav a').get().map(x => $(x).text()))
        .then(flavors => flavors.map(x => 
            x.replace('  ', ' ')
             .trim()
        ))

const cleanForMatch = (value) => 
    value
        .toLowerCase()
        .replace(/ /g, "")
        .replace("&", "and")
        .replace(/choc\./g, "chocolate")

const hasFlavor = (flavor) =>
    getFlavors()
        .then(flavors => 
            flavors
                .map(cleanForMatch)
                .includes(cleanForMatch(flavor))
        )

const toSsmlList = (array) => 
    array.map(x => x
        .replace('&', '&amp;')
        .replace(/hoc\./g, 'hocolate')
        .replace(/ucinno/g, 'ucheeno')
    )
    .join(' <break strength="medium" /> ')

const handlers = {
    'LaunchRequest': function () {
        this.emit('TodaysFlavors');
    },
    'TodaysFlavors': function () {
        getFlavors().then(flavors => {
            this.response.cardRenderer(SKILL_NAME, flavors.join('\r\n'));
            this.response.speak("Today's flavors are:" + toSsmlList(flavors));
            this.emit(':responseReady');
        })
    },
    'HasFlavor': function () {
        const flavor = this.event.request.intent.slots.flavor.value;
        hasFlavor(flavor).then(resp => {
            const answer = 
                resp ?
                    `Yep, according to the website, they do have ${flavor}!` :
                    `No, sorry - according to the website, do not have ${flavor}.`;
            this.response.cardRenderer(SKILL_NAME, answer);
            this.response.speak(answer);
            this.emit(':responseReady');
        }) 
    },
    'AMAZON.HelpIntent': function () {
        this.response
            .speak('You can say tell me what flavors Ice House has, or, you can say exit... What can I help you with?')
            .listen('What can I help you with?');

        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak('Goodbye!');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Goodbye!');
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = "amzn1.ask.skill.dfb55770-267e-4584-ba9d-c58a4177c5eb";
    alexa.registerHandlers(handlers);
    alexa.execute();
};

exports.handlers = handlers;
