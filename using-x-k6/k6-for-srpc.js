// export K6_WEB_DASHBOARD=true export K6_WEB_DASHBOARD_OPEN=true
// k6 run dist/k6-for-srpc.js
// http://127.0.0.1:5665

/*
npx esbuild k6-for-srpc.js \
  --bundle \
  --format=esm \
  --platform=browser \
  --target=es2015 \
  --external:k6 \
  --external:k6/* \
  --outfile=dist/k6-for-srpc.js
*/


import { Socket } from "k6/x/tcp";
import { encode, decode } from "@msgpack/msgpack";
import { Counter } from "k6/metrics";

const srpcErrors = new Counter("rpc_errors");

export const options = {
    scenarios: {
        throughput_test: {
            executor: "constant-vus",
            vus: 1000,
            duration: "60s",
        },
    },
};

const HOST = "192.168.0.143";
const PORT = 5000;

const HEADER_SIZE = 8;


function buildRequest(procId, params) {
    const payload = encode(params);

    const request = new Uint8Array(
        HEADER_SIZE + payload.length
    );

    const view = new DataView(request.buffer);

    // Big-endian
    view.setUint16(0, 0, false);               // protocol version
    view.setUint16(2, procId, false);          // procedure ID
    view.setUint32(4, payload.length, false);  // payload size

    request.set(payload, HEADER_SIZE);

    return request.buffer;
}


async function remoteCall(procId, params) {

    const socket = new Socket();

    const request = buildRequest(procId, params);

    return new Promise(async (resolve, reject) => {

        let buffer = new Uint8Array(0);
        let expectedPayloadSize = null;

        socket.on("data", (data) => {

            const received = new Uint8Array(data);

            /*
             * Append received bytes.
             */
            const combined = new Uint8Array(
                buffer.length + received.length
            );

            combined.set(buffer);
            combined.set(received, buffer.length);

            buffer = combined;


            /*
             * Decode header once enough bytes are available.
             */
            if (
                expectedPayloadSize === null &&
                buffer.length >= HEADER_SIZE
            ) {

                const view = new DataView(
                    buffer.buffer,
                    buffer.byteOffset,
                    buffer.byteLength
                );

                const version =
                    view.getUint16(0, false);

                const code =
                    view.getUint16(2, false);

                expectedPayloadSize =
                    view.getUint32(4, false);

                if (code !== 0){
                    srpcErrors.add(1);
                    console.log("srpcError")
                }
                /*console.log(JSON.stringify({
                    version,
                    code,
                    expectedPayloadSize,
                }));*/
            }


            /*
             * Wait for entire payload.
             */
            if (
                expectedPayloadSize !== null &&
                buffer.length >= HEADER_SIZE + expectedPayloadSize
            ) {

                try {

                    const payload = buffer.slice(
                        HEADER_SIZE,
                        HEADER_SIZE + expectedPayloadSize
                    );

                    const response = decode(payload);

                    socket.destroy();

                    resolve(response);

                } catch (error) {

                    socket.destroy();

                    reject(error);
                }
            }
        });


        socket.on("error", (error) => {
            socket.destroy();
            reject(error);
        });


        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error("RPC timeout"));
        });


        try {

            await socket.connect(PORT, HOST);

            //socket.setTimeout(5000);

            await socket.write(request);

        } catch (error) {

            socket.destroy();

            reject(error);
        }
    });
}


export default async function () {

    const result = await remoteCall(0, [100]);
    //console.log(result)

}