import { scan } from "../src/service.js";

const issueUrl = process.argv[2];
if (!issueUrl) {
  console.error("Usage: npm run verify:live -- https://github.com/owner/repo/issues/123");
  process.exitCode = 2;
} else {
  const response = await scan({
    action: "verify",
    issueUrl,
    languages: ["TypeScript", "JavaScript", "Python", "MCP", "Node"],
  });
  console.log(JSON.stringify(response, null, 2));
}
