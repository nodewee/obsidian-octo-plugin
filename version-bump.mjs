import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
    console.error("No version found in package.json");
    process.exit(1);
}

console.log(`Bumping version to ${targetVersion}`);

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

manifest.version = targetVersion;
packageJson.version = targetVersion;

writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"));

console.log("Version bumped successfully!");
