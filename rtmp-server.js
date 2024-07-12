const NodeMediaServer = require('node-media-server');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const JProfile = require('./models/JProfile');
const Stream = require("./models/Stream");
const {v4} = require("uuid");
const Pusher = require("pusher");

const redis = new Redis(process.env.REDIS_URL);
const MONGODB_URI = process.env.MONGODB_URI;


const CHANNEL_NAME = 'stream-channel';
const START_BROADCAST = 'start-broadcast';
const END_BROADCAST = 'end-broadcast';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
});


mongoose.connect(MONGODB_URI).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

let ffmpegPath;

try {
    if (process.platform === 'win32') {
        ffmpegPath = require('child_process').execSync('where ffmpeg').toString().trim();
    } else {
        ffmpegPath = require('child_process').execSync('which ffmpeg').toString().trim();
    }
    console.log(`FFmpeg path: ${ffmpegPath}`);
} catch (error) {
    console.error('Error finding FFmpeg path:', error);
    process.exit(1);
}

const config = {
    rtmp: {
        port: 1990,
        chunk_size: 60000,
        gop_cache: true,
        ping: 60,
        ping_timeout: 120
    },
    http: {
        port: 8060,
        mediaroot: '/app/media',
        allow_origin: '*'
    },
    trans: {
        ffmpeg: ffmpegPath,
        tasks: [
            {
                app: 'live',
                vc: process.env.VC,
               // vcParam: ['-crf', '23', '-preset', 'superfast', '-profile:v', 'baseline', '-level', '3.0', '-tune', 'zerolatency', '-x264-params', 'nal-hrd=cbr:force-cfr=1', '-b:v', '2500k', '-minrate', '2500k', '-maxrate', '2500k', '-bufsize', '5000k'],
                ac: process.env.AC,
                acParam: ['-ab', '64k', '-ac', '1', '-ar', '44100'],
                hls: true,
                hlsFlags: '[hls_time=6:hls_list_size=18:hls_flags=delete_segments+split_by_time+round_durations+discont_start]'
            }
        ]
    }
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (id, StreamPath, args) => {
    let streamKey = getStreamKeyFromStreamPath(StreamPath);
    let isValid = await validateStreamKey(streamKey);

    if (!isValid) {
        let session = nms.getSession(id);
        session.reject();
        console.log(`Stream rejected for invalid stream key: ${streamKey}`);
    } else {
        await redis.set(`stream:${streamKey}:status`, 'live');
        await redis.set(`stream:${streamKey}:metrics`, JSON.stringify({ viewers: 0, bitrate: 0, fps: 0 }));
        console.log(`Stream started with stream key: ${streamKey}`);
    }

    console.log(`PrePublish Event - ID: ${id}, StreamPath: ${StreamPath}`);

    const profile = await JProfile.findOne({ streamKey });
    await JProfile.updateOne({ _id: profile._id }, {
        $set: {
            flags: 4
        }
    })

    await pusher.trigger(CHANNEL_NAME, START_BROADCAST, { profile })
});

nms.on('donePublish', async (id, StreamPath, args) => {
    let streamKey = getStreamKeyFromStreamPath(StreamPath);
    await redis.set(`stream:${streamKey}:status`, 'offline');
    console.log(`Stream stopped with stream key: ${streamKey}`);
    console.log(`DonePublish Event - ID: ${id}, StreamPath: ${StreamPath}`);

    const profile = await JProfile.findOne({ streamKey });
    await JProfile.updateOne({ _id: profile._id }, {
        $set: {
            flags: 1
        }
    })

    await pusher.trigger(CHANNEL_NAME, END_BROADCAST, { profile })
});

nms.on('postPlay', async (id, StreamPath, args) => {
    let streamKey = getStreamKeyFromStreamPath(StreamPath);
    let metrics = JSON.parse(await redis.get(`stream:${streamKey}:metrics`));
    metrics.viewers += 1;
    await redis.set(`stream:${streamKey}:metrics`, JSON.stringify(metrics));
    console.log(`Viewer joined stream with stream key: ${streamKey}`);
    console.log(`PostPlay Event - ID: ${id}, StreamPath: ${StreamPath}`);
});

nms.on('donePlay', async (id, StreamPath, args) => {
    let streamKey = getStreamKeyFromStreamPath(StreamPath);
    let metrics = JSON.parse(await redis.get(`stream:${streamKey}:metrics`));
    metrics.viewers -= 1;
    await redis.set(`stream:${streamKey}:metrics`, JSON.stringify(metrics));
    console.log(`Viewer left stream with stream key: ${streamKey}`);
    console.log(`DonePlay Event - ID: ${id}, StreamPath: ${StreamPath}`);
});

nms.on('rtmp', async (id, streamPath, args) => {
    let streamKey = getStreamKeyFromStreamPath(streamPath);
    let session = nms.getSession(id);
    session.on('data', async (data) => {
        if (data.type === 'audio' || data.type === 'video') {
            let metrics = JSON.parse(await redis.get(`stream:${streamKey}:metrics`));
            metrics.bitrate = session.bitrate;
            metrics.fps = session.fps;
            await redis.set(`stream:${streamKey}:metrics`, JSON.stringify(metrics));
            console.log(`Stream data received: bitrate=${metrics.bitrate}, fps=${metrics.fps}`);
        }
    });
    console.log(`RTMP Event - ID: ${id}, StreamPath: ${streamPath}`);

    redis.set('live-path', streamPath)
});

function getStreamKeyFromStreamPath(path) {
    let parts = path.split('/');
    return parts[parts.length - 1];
}

async function validateStreamKey(streamKey) {
    try {
        const profile = await JProfile.findOne({ streamKey });
        console.log(`Stream key validation for ${streamKey}: ${!!profile}`);

        await Stream.updateOne({ _id: '667fcb22f7db520f8079faf2' }, {
            $set: {
                streamId: v4()
            }
        })

        redis.set('live-key', streamKey)

        return !!profile;
    } catch (error) {
        console.error('Error validating stream key:', error);
        return false;
    }
}

nms.run();
