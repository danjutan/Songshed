import { kv } from "@nuxthub/kv";
// We're using a simple KV for now as we just have a dummy, global shared save feature,
// but we'll soon use a database with different users
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return;
  if (event.method === "POST") {
    const body = await readBody(event);
    console.log(body);

    await kv.set(id!, body);
    return {
      id,
    };
  }
  if (event.method === "GET") {
    // In the new implementation of kv, getItem automatically deserializes the object,
    // but we want to deserialize it ourselves on the client. So we use
    // `getItemRaw` and decode the buffer it returns
    const rawTabData = await kv.getItemRaw<Uint8Array>(id);
    if (rawTabData == null) return null;
    return new TextDecoder().decode(rawTabData);
  }
});
