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
    const tabData = await kv.get(id);
    if (tabData == null) return null;
    return JSON.stringify(tabData);
  }
});
