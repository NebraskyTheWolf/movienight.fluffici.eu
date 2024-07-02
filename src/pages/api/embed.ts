// pages/api/embed.js

import fetch, { RequestInfo } from 'node-fetch';
import {HTMLElement, parse as parseHTML} from 'node-html-parser';
import sizeOf from 'image-size';
import mime from 'mime-types';
import {NextApiRequest, NextApiResponse} from "next";

const RE_TWITTER = /^(?:https?:\/\/)?(?:www\.)?twitter\.com/;

const fetchMetadata = async (url: string[] | URL | RequestInfo) => {
    url = <string>url

    if (RE_TWITTER.test(url)) {
        url = url.replace(RE_TWITTER, 'https://twitter.net');
    }

    const res = await fetch(url);
    const buffer = await res.buffer();
    const contentType = res.headers.get('content-type');
    const mimeType = mime.lookup(contentType!);

    console.log(mimeType)

    if (!mimeType) {
        return {type: 'none'};
    }

    if (mimeType.includes('html')) {
        const html = buffer.toString();
        const root = parseHTML(html);
        const metadata = extractMetadata(root, url);

        if (Object.keys(metadata).length === 0) {
            return {type: 'none'};
        }

        return {type: 'website', metadata};
    } else if (mimeType.includes('image')) {
        const dimensions = sizeOf(buffer);
        return {
            type: 'image',
            image: {
                url,
                width: dimensions.width,
                height: dimensions.height,
                size: 'large',
            },
        };
    } else if (mimeType.includes('video')) {
        const dimensions = sizeOf(buffer);
        return {
            type: 'video',
            video: {
                url,
                width: dimensions.width,
                height: dimensions.height,
            },
        };
    } else {
        return {type: 'none'};
    }
};

const extractMetadata = (root: HTMLElement, url: any) => {
    return {
        title: root.querySelector('title')?.text,
        description: root.querySelector('meta[name="description"]')?.getAttribute('content'),
        image: root.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        themeColor: root.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
        url,
    };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.query;
    if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    try {
        let result = await fetchMetadata(url);

        res.status(200).json({ status: true, ...result });
    } catch (error) {
        console.log(error)
        res.status(500).json({ status: false, data: {} });
    }
};
