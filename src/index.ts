import { TeamSpeak } from "ts3-nodejs-library";
import { loadConfig } from "./config";
import { Sinusbot } from "./sinusbot";

const configPath = Bun.env["CONFIG_PATH"] ?? "./config.json";
const reviveInterval = Number.parseInt(Bun.env["REVIVE_INTERVAL"] ?? "30000");

const config = await loadConfig(configPath);

const revive = async(instanceId: string, sinusbot: string) => {
	const bot = config.sinusbots[sinusbot];

	if (!bot) {
		throw new Error("Sinusbot entry not found");
	}

	const sb = new Sinusbot(bot.username, bot.password, bot.url);

	await sb.login();
	await sb.restartBot(instanceId);
};

const setup = async () => {
	const p = [];

	for (const server of config.servers) {
		p.push(
			TeamSpeak.connect(server.details).then(async (connection) => {
				const fullIp = `${server.details.host}:${server.details.serverport} (${server.details.queryport})`;

				console.info(`Connected to: ${fullIp}`);

				connection.on("close", async () => {
					console.info(`Connection closed! (${fullIp})`);
					await connection.reconnect(-1, 10000);
					console.info(`Reconnected! (${fullIp})`);
				});

				const check = async () => {
					for (const uid in server.instances) {
						const data = server.instances[uid];

						if (!data) {
							throw new Error("Logic error");
						}

						const { instanceId, sinusbot } = data;

						const client = await connection.getClientByUid(uid);

						if(client) {
							continue;
						}

						console.info(`Trying to revive dead bot: ${uid} (${instanceId}) - ${fullIp}`);
						await revive(instanceId, sinusbot);
						console.info(`Bot should be alive: ${uid} (${instanceId}) - ${fullIp}`);
					}

					setTimeout(check, reviveInterval);
				};

				await check();
			}),
		);
	}

	await Promise.all(p);
};

await setup();

console.info("Ready!");
