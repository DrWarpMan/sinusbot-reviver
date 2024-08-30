import { QueryProtocol } from "ts3-nodejs-library";
import { z } from "zod";
import { convertRelativePath } from "./path";

const configSchema = z
	.object({
		sinusbots: z.record(
			z.object({
				url: z.string().min(1),
				username: z.string().min(1),
				password: z.string().min(1),
			}),
		),
		servers: z.array(
			z.object({
				details: z.object({
					host: z.string().min(1),
					protocol: z
						.enum([QueryProtocol.RAW, QueryProtocol.SSH])
						.default(QueryProtocol.RAW),
					queryport: z.number().int().min(1).max(65535).default(10011),
					serverport: z.number().int().min(1).max(65535).default(9987),
					username: z.string(),
					password: z.string(),
					nickname: z.string().min(3).default("Sinusbot Reviver"),
					channelId: z.string().nullish().default(null),
				}),
				instances: z.record(
					z.object({
						sinusbot: z.string().min(1),
						instanceId: z.string().min(1),
					}),
				),
			}),
		),
	})
	.refine((data) => {
		for (const server of data.servers) {
			for (const { sinusbot } of Object.values(server.instances)) {
				if (!data.sinusbots[sinusbot]) {
					return false;
				}
			}
		}

		return true;
	}, "Instance must reference to existing Sinusbot entry.");

export type Config = z.infer<typeof configSchema>;

export const loadConfig = async (path: string): Promise<Config> => {
	try {
		const resolvedPath = convertRelativePath(path);

		const json = (await Bun.file(resolvedPath).json()) as unknown;

		const result = await configSchema.safeParseAsync(json);

		if (!result.success) {
			throw result.error;
		}

		return result.data;
	} catch (e) {
		console.error("Can not read/parse config file.");
		throw e;
	}
};
