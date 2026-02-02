import { PrimusZKTLS } from "@primuslabs/zktls-js-sdk";

let instance: PrimusZKTLS | null = null;

export async function getPrimusInstance(): Promise<PrimusZKTLS> {
  if (instance) return instance;

  const appId = process.env.NEXT_PUBLIC_PRIMUS_APP_ID;
  const appSecret = process.env.PRIMUS_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("PRIMUS_APP_ID and PRIMUS_APP_SECRET must be set");
  }

  instance = new PrimusZKTLS();
  await instance.init(appId, appSecret);
  return instance;
}
