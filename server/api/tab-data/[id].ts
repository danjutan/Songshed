export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  console.log(id);
  await hubKV().set(id!, { id });
  return {
    test: id,
  };
});
