import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "HtmlDiff",
	description: "Diff two HTML blocks and get a marked-up merge",
	base: "/HtmlDiff/",
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Getting Started", link: "/guide/getting-started" },
			{ text: "Demo", link: "/demo" },
		],

		sidebar: [
			{
				text: "Guide",
				items: [{ text: "Getting Started", link: "/guide/getting-started" }],
			},
		],

		socialLinks: [{ icon: "github", link: "https://github.com/Atulin/HtmlDiff" }],

		footer: {
			message: "Released under the ISC License.",
		},
	},
});
