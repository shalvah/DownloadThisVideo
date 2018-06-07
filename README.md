# DownloadThisVideo
Easily download videos/GIFs off Twitter. Mention the bot (@this_vid) in a reply to the tweet containing the video, and it'll reply with the link in a few minutes.

## How this works
## Stack
- [AWS Lambda](https://aws.amazon.com/lambda/) with the [Serverless Framework](http://serverless.com)
- [AWS SNS](http://aws.amazon.com/sns)
- [Redis](http://redis.io)
- Node.js 8.10

### Implementation
There are three Lambda Functions:
- **fetchTweetsToDownload** runs every 5 minutes and checks for new mentions. It publishes these new mentions as a new notification on an SNS topic
- **sendDownloadLink** is triggered by new SNS messages. It processes the tweets in the message body, retrieves download links and sends to the user.
- **retryFailedTasks** runs every hour and re-publishes failed tasks as a new SNS message

### Notes
- Retrieved video links are cached in Redis
- Why 10 minute intervals? So as to not hit Twitter's rate limits and minimize AWS Lambda usage time, while being near-realtime. An alternate implementation would be to use Twitter's Streaming API. However, this wouldn't work with AWS Lambda (max runtime of a function is 300 seconds), so I'd need to maintain a dedicated server for that.

## Todo
- Set TTLs for all cached values to ensure more important data is retained longer. (Priority: :arrow_up:)
- Add a filter to avoid processing tweets we already replied to (am I overengineering this?) (Priority: :arrow_down:)
- Support processing tweets where the referenced tweet is a retweet of a tweet containing a video (I'm not sure, but I think this currently works)
- Support DMs (DMing the bot with the tweet link) (Priority: :arrow_down:)
- I've discovered there are different types of video shared via Twitter. For non-native video, the `extended_entities` object is not present, so the bot fails. We need to look into supporting other types of video
