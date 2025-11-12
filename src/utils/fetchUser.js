export const fetchUser = async (client, id) => {
  const user = await client.users.fetch(id).catch(() => null);
  return user;
};
