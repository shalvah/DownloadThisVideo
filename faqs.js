module.exports = [
    {
        question: 'How do I use this? ❓',
        answer: "First, find a tweet with a video you'd like to download. Then mention @this_vid in a reply to the tweet. "
        + "Visit http://thisvid.space/your-Twitter-handle in a few minutes and you should see the link to download your video. "
        + "For instance, if your twitter handle is @jack, your downloads will be at thisvid.space/jack.😄",
        id: "how-to-use",
    },
    {
        question: 'I quoted @this_vid on a tweet but I didn\'t get a response. 😐',
        answer: "@this_vid currently doesn't work with quotes. Please use a reply instead. (Reply to the tweet that has the video.)",
        id: "quotes",
    },
    {
        question: 'I mentioned @this_vid in a reply but I didn\'t get a response. 😕',
        answer: "I'm sorry; Twitter only allows me to post 300 tweets every 3 hours, so I can't reply to every request. "
        + "But your download still gets processed! You can check for it at thisvid.space/your-Twitter-handle. "
        + "For instance, if your twitter handle is @jack, your downloads will be at thisvid.space/jack. "
        + "To make things easier, you can bookmark the link in your browser.😅"
        + "You can also <a href=\"#notifications\">enable push notifications</a> on your device.",
        id: "no-response",
    },
    {
        question: 'I mentioned @this_vid in a reply and I checked my downloads page, but there was nothing there! 😭',
        answer: "Sorry about that. I try my best, but there are a few reasons this might have happened. "
        + "Some videos are restricted by Twitter (usually videos published by big organisations), and we aren't able to download them. "
        + "Also, I can't access a video uploaded by a user if their account is private or they've blocked the bot. Lastly, I can't see your mention if your account is private. "
        + "Maybe unlock it for a bit?😓",
        id: "missing-download",
    },
    {
        question: 'How do I download videos on my iPhone? 🤔',
        answer: "iOS is a very restricted platform, so you'll need an external app for that. "
        + "You can download videos to your device using the VLC Media Player app. "
        + "You'll find more details in <a href='https://www.quora.com/How-do-I-download-video-on-the-iPhone/answer/Raman-Kashyap-4'>this Quora answer</a>.",
        id: "ugh-ios",
    },
    {
        question: 'How do I download videos on my Android device? 🤔',
        answer: "In Google Chrome, press and hold on the Video Link. In the popup that shows, select 'Download link', and the video will be downloaded to your device.",
        id: "android",
    },
    {
        question: 'How do I download videos on my PC/laptop? 🤔',
        answer: "Right-click on the Video Link and select 'Save link as...' (or 'Download link'). Enter a file name and the video will be downloaded to your device.",
        id: "pc",
    },
    {
        question: 'How much does it cost to use @this_vid? 💵💵',
        answer: "Nothing! @this_vid is totally free! If you'd like to support development and keep it running, you can <a href='http://patreon.com/shalvah'>support my development work on Patreon</a>.",
        id: "price",
    },
    {
        question: 'Are you human? 👨',
        answer: "Nope. I'm an automated account (bot) controlled by code written by some guy with a computer.👨‍💻 Occasionally, my handler will take control of my account to tweet updates, but apart from that, it's all automated.",
        id: "human",
    },
    {
        question: 'How does @this_vid work? 🔧',
        answer: "I make use of Twitter's APIs and a few other components. If you're interested, you can take a look at <a href='https://github.com/shalvah/DownloadThisVideo'>the source code</a>.",
        id: "how-it-works",
    },
    {
        question: 'How do I get notified when my download is ready?',
        answer: "If you use a <a href=\"#notifications-support\">supported browser</a>, you can enable push notifications by going to your downloads page. Whenever you request a new download and it's processed, you'll get a notification on your device (via your browser), so you don't have to remember to check the site manually.",
        id: "notifications",
    },
    {
        question: 'What platforms are supported for push notifications??',
        answer: "Chrome/Firefox on PC/Mac/Android are supported. iOS (any browser) and Safari on Mac aren't supported (and won't be) because Apple devices don't support the necessary APIs.🤷‍♀️",
        id: "notifications-support",
    },
];
