import { ListObjectsV2Command, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const cached = {};

export async function setupS3(url) {
    if (!(url in cached)) {
        let res = await fetch(url + "/credentials/s3-api");
        if (!res.ok) {
            throw new Error("failed to retrieve S3 credentials for bucket access")
        }

        let config = await res.json();

        const client = new S3Client({
            region: "auto",
            endpoint: config.endpoint,
            credentials: {
                accessKeyId: config.key,
                secretAccessKey: config.secret
            }
        });

        cached[url] = { bucket: config.bucket, client };
    }

    return cached[url];
}

export async function quickList(url, params, fun) {
    const { bucket, client } = await setupS3(url);
    let options = { Bucket: bucket, ...params };
    while (true) {
        let out = await client.send(new ListObjectsV2Command(options));
        fun(out);
        if (!out.IsTruncated) {
            break;
        }
        options.ContinuationToken = out.NextContinuationToken;
    }
}

export async function fetchFile(url, key, { mustWork = true } = {}) {
    const { bucket, client } = await setupS3(url);

    try {
        // Need the await here for the try/catch to work properly.
        return await client.send(new GetObjectCommand({Bucket: bucket, Key: key }));
    } catch (e) {
        if (mustWork) {
            throw new Error("failed to fetch '" + key + "'", { cause: e });
        } else {
            return null;
        }
    }
}

export async function fetchJson(url, key, { mustWork = true } = {}) {
    let fres = await fetchFile(url, key, { mustWork });
    if (fres === null) {
        return null;
    }
    let stringified = await fres.Body.transformToString("utf-8");
    return JSON.parse(stringified);
}
