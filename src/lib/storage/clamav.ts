import net from "net";

export type ScanResult = {
  infected: boolean;
  result: string;
  skipped: boolean;
};

function clamEnabled() {
  return process.env.CLAMAV_ENABLED === "true";
}

async function pingClam(): Promise<boolean> {
  const host = process.env.CLAMAV_HOST || "127.0.0.1";
  const port = Number(process.env.CLAMAV_PORT || 3310);
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.write("PING\n");
    });
    let data = "";
    socket.setTimeout(2000);
    socket.on("data", (chunk) => {
      data += chunk.toString();
      socket.end();
    });
    socket.on("end", () => resolve(data.includes("PONG")));
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export async function scanBuffer(buffer: Buffer): Promise<ScanResult> {
  if (!clamEnabled()) {
    return { infected: false, result: "scan_skipped_disabled", skipped: true };
  }

  const available = await pingClam();
  if (!available) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ClamAV is required but unavailable");
    }
    return { infected: false, result: "scan_skipped_unavailable", skipped: true };
  }

  const host = process.env.CLAMAV_HOST || "127.0.0.1";
  const port = Number(process.env.CLAMAV_PORT || 3310);

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      // INSTREAM protocol
      socket.write("zINSTREAM\0");
      const size = Buffer.alloc(4);
      size.writeUInt32BE(buffer.length, 0);
      socket.write(size);
      socket.write(buffer);
      const zero = Buffer.alloc(4);
      zero.writeUInt32BE(0, 0);
      socket.write(zero);
    });

    let response = "";
    socket.setTimeout(60_000);
    socket.on("data", (chunk) => {
      response += chunk.toString();
    });
    socket.on("end", () => {
      const infected = /FOUND/.test(response) && !/OK/.test(response);
      resolve({
        infected,
        result: response.trim() || "unknown",
        skipped: false,
      });
    });
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("ClamAV scan timed out"));
    });
  });
}
