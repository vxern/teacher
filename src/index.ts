import { LunaClient } from './client/client';

const Client: LunaClient = new LunaClient();

const requiredEnv = ['DISCORD_SECRET', 'FAUNA_SECRET', 'YOUTUBE_SECRET'];
const presentEnv = requiredEnv.map((value) => value in process.env);

// If there is an environment variable not present
if (presentEnv.includes(false)) {
  const notPresent = (value: boolean) => !value;
  const notPresentEnv = presentEnv.filter(notPresent).map((_, index) => requiredEnv[index]);
  console.error(`Missing one or more required environment variables: ${notPresentEnv.join(', ')}`);
  process.exit(1);
}

async function main() {
  await Client.login();
}

main().catch((error) => console.error(error));