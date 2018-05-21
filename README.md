# DownloadThisVideo
Easily download videos/GIFs off Twitter. Mention the bot (@this_vid) in a reply to the tweet containing the video, and it'll reply with the link in a few minutes.

## How this works
## Stack
- [AWS Lambda](https://aws.amazon.com/lambda/) with the [Serverless Framework](http://serverless.com)
- [Redis](http://redis.io)
- Node.js 8.10

### Implementation
There are two Lambda Functions:
- **fetchTweetsToDownload** runs every 10 minutes and checks for new mentions. It puts any valid mentions found in the task queue and exits.
- **sendDownloadLinks** runs every 10 minutes. It checks if there are any tasks in the queue, and then processes them one by one (fetches video links and sends to user).

### Notes
- Retrieved video links are cached in Redis
- Task Queue implemented with Redis

## Todo
- Refactor `sendDownloadLinks` so it dispatches a separate Lambda function for each task, in order to prevent the function tiiming out. On the other hand, we'd need to be careful, as this can result in hitting Twitter's rate limits. (Priority: :arrow_up:)
- Set TTLs for all cached values to ensure more important data is retained longer. (Priority: :arrow_up:)
- Add a filter to avoid processing tweets we already replied to (am I overengineering this?) (Priority: :arrow_down:)
