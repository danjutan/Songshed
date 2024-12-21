export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  console.log(event.method);
  await hubKV().set(id!, { id });
  return {
    test: id,
  };
});
