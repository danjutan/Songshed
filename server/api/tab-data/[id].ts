export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) return;
  if (event.method === "POST") {
    const body = await readBody(event);

    await hubKV().set(id!, body);
    return {
      id,
    };
  }
  if (event.method === "GET") {
    const tabData = await hubKV().getItemRaw(id);
    return tabData;
  }
});
