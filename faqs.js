module.exports = [
    {
        question: 'How do I use this? ❓',
        answer: "First, find a tweet with a video you'd like to download. Then mention @this_vid in a reply to the tweet. "
        + "Visit http://thisvid.space/your-Twitter-handle in a few minutes and you should see the link to download your video. "
        + "For instance, if your twitter handle is @jack, your downloads will be at thisvid.space/jack.😄"
    },
    {
        question: 'I quoted @this_vid on a tweet but I didn\'t get a response. 😐',
        answer: "@this_vid currently doesn't work with quotes. Please use a reply instead. (Reply to the tweet that has the video.)"
    },
    {
        question: 'I mentioned @this_vid in a reply but I didn\'t get a response. 😕',
        answer: "I'm sorry; Twitter only allows me to post 300 tweets every 3 hours, so I can't reply to every request. "
        + "But your download still gets processed! You can check for it at thisvid.space/your-Twitter-handle. "
        + "For instance, if your twitter handle is @jack, your downloads will be at thisvid.space/jack. "
        + "To make things easier, you can bookmark the link in your browser.😅"
    },
    {
        question: 'I mentioned @this_vid in a reply and I checked my downloads page, but there was nothing there! 😭',
        answer: "Sorry about that. I try my best, but there are a few reasons this might have happened. "
        + "Some videos are restricted by Twitter (usually videos published by big organisations), and we aren't able to download them. "
        + "Also, I can't access a video uploaded by a user if their account is private or they've blocked the bot. Lastly, I can't see your mention if your account is private. "
        + "Maybe unlock it for a bit?😓"
    },
    {
        question: 'How do I download videos on my iPhone? 🤔',
        answer: "iOS is a very restricted platform, so you'll need an external app for that. "
        + "You can download videos to your device using the VLC Media Player app. "
        + "You'll find more details in <a href='https://www.quora.com/How-do-I-download-video-on-the-iPhone/answer/Raman-Kashyap-4'>this Quora answer</a>."
    },
    {
        question: 'How do I download videos on my Android device? 🤔',
        answer: "In Google Chrome, press and hold on the Video Link. In the popup that shows, select 'Download link', and the video will be downloaded to your device."
    },
    {
        question: 'How do I download videos on my PC/laptop? 🤔',
        answer: "Right-click on the Video Link and select 'Save link as...' (or 'Download link'). Enter a file name and the video will be downloaded to your device."
    },
    {
        question: 'How much does it cost to use @this_vid? 💵💵',
        answer: "Nothing! @this_vid is totally free! If you'd like to support development and keep it running, you can <a href='http://patreon.com/shalvah'>support my development work on Patreon</a>."
    },
    {
        question: 'Are you human? 👨',
        answer: "Nope. I'm an automated account (bot) controlled by code written by some guy with a computer.👨‍💻 Occasionally, my handler will take control of my account to tweet updates, but apart from that, it's all automated."
    },
    {
        question: 'How does @this_vid work? 🔧',
        answer: "I make use of Twitter's APIs and a few other components. If you're interested, you can take a look at <a href='https://github.com/shalvah/DownloadThisVideo'>the source code</a>."
    },
];
