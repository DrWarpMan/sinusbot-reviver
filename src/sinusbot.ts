export class Sinusbot {
    #username: string;
    #password: string;
    #url: string;
    #_token?: string;
    get #token(): string {
        if (!this.#_token) {
            throw new Error("Not logged in");
        }

        return this.#_token;
    }

    constructor(username: string, password: string, url: string) {
        this.#username = username;
        this.#password = password;
        this.#url = url;

        if (this.#url.endsWith("/")) {
            this.#url = this.#url.slice(0, -1);
        }
    }

    async #getDefaultBotId(): Promise<string> {
        const response = await fetch(`${this.#url}/api/v1/botId`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to get default bot id");
        }
        
        const data = await response.json() as { defaultBotId: string };

        return data.defaultBotId;
    }

    async login(): Promise<void> {
        const botId = await this.#getDefaultBotId();

        const response = await fetch(`${this.#url}/api/v1/bot/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: this.#username,
                password: this.#password,
                botId,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to login");
        }

        const data = await response.json() as { token: string };

        this.#_token = data.token;
    }

    async restartBot(instanceId: string): Promise<void> {
        let response = await fetch(`${this.#url}/api/v1/bot/i/${instanceId}/kill`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.#token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to kill bot");
        }

        await new Promise((resolve) => setTimeout(resolve, 2500));

        response = await fetch(`${this.#url}/api/v1/bot/i/${instanceId}/spawn`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.#token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to spawn bot");
        }
    }
}