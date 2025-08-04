import { create } from "ipfs-http-client";

const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: `Basic ${Buffer.from(
      `${PROJECT_ID}:${PROJECT_SECRET}`
    ).toString("base64")}`,
  },
});

export const uploadToIPFS = async (data) => {
  const result = await ipfs.add(data);
  return result.path;
};
