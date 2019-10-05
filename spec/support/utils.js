'use strict';

const createUser = (username = null, id = null) => {
    return {
        id: id || 6253282,
        id_str: id || "6253282",
        name: "Rando dude",
        screen_name: username || "rando_dude12",
        location: "San Francisco, CA",
        profile_location: null,
        description: "Meh",
        entities: {},
        protected: false,
        followers_count: 6133636,
        friends_count: 12,
        listed_count: 12936,
        created_at: "Wed May 23 06:01:13 +0000 2007",
        favourites_count: 31,
        utc_offset: null,
        time_zone: null,
        geo_enabled: null,
        verified: true,
        statuses_count: 3656,
        lang: null,
        contributors_enabled: null,
        is_translator: null,
        is_translation_enabled: null,
        profile_background_color: null,
        profile_background_image_url: null,
        profile_background_image_url_https: null,
        profile_background_tile: null,
        profile_image_url: null,
        profile_image_url_https: "https:\/\/pbs.twimg.com\/profile_images\/942858479592554497\/BbazLO9L_normal.jpg",
        profile_banner_url: null,
        profile_link_color: null,
        profile_sidebar_border_color: null,
        profile_sidebar_fill_color: null,
        profile_text_color: null,
        profile_use_background_image: null,
        has_extended_profile: null,
        default_profile: false,
        default_profile_image: false,
        following: null,
        follow_request_sent: null,
        notifications: null,
        translator_type: null
    };
};

const createTweet = ({ username = null, text = null, inReplyTo = null, retweetedTweet = null, date = new Date} = {}) => {
    username = username || 'rando_dude12';
    text = text || `@${username} Hehe, random.`;
    text = inReplyTo ? `@${inReplyTo.user} ${text}` : text;
    return {
        created_at: require('moment')(date).format('ddd MMM D HH:mm:ss ZZ YYYY'), // something like 'Sun Sep 22 11:48:59 +0000 2019'
        id: 8759849726758343547627,
        id_str: '8759849726758343547627',
        text,
        display_text_range: [],
        source: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
        truncated: false,
        in_reply_to_status_id: inReplyTo ? 34788 : null,
        in_reply_to_status_id_str: inReplyTo ? inReplyTo.id : null,
        in_reply_to_user_id: inReplyTo ? 5499273 : null,
        in_reply_to_user_id_str: inReplyTo ? '5499273' : null,
        in_reply_to_screen_name: inReplyTo ? inReplyTo.user : null,
        user: createUser(username, '78564765'),
        geo: null,
        coordinates: null,
        place: {},
        contributors: null,
        is_quote_status: false,
        retweeted_status: retweetedTweet,
        quote_count: 0,
        reply_count: 0,
        retweet_count: 0,
        favorite_count: 0,
        entities: {},
        favorited: false,
        retweeted: false,
        filter_level: 'low',
        lang: 'en',
        timestamp_ms: '1569152939970'
    }
};

const createRetweet = (opts = {}) => {
    opts.retweetedTweet = createTweet();
    return createTweet(opts);
};

const createSnsEvent = (numberOfTweets) => {
    const tweetData = {
        id: "3",
        time: "Wed May 23 06:01:13 +0000 2007",
        referencing_tweet: "3",
        author: "some_dude",
    };
    const tweets = new Array(numberOfTweets).fill(tweetData);

    const event = {
        Records: [
            {
                Sns: {
                    Message: JSON.stringify(tweets),
                }
            }
        ]
    };
    return event;
};

module.exports = {
    createTweet,
    createRetweet,
    createUser,
    createSnsEvent,
};