#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const endpoint = process.argv[2];
if (!endpoint) {
  console.error("Usage: node api_detail.js <endpoint-path>");
  process.exit(1);
}

const schemaPath = path.join(__dirname, "..", "schemas.json");
const schemas = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

for (const schema of schemas) {
  if (schema.route === endpoint) {
    console.log(JSON.stringify(schema, null, 2));
    process.exit(0);
  }
  if (schema.routes) {
    for (const route of schema.routes) {
      if (schema.route + "/" + route.name === endpoint) {
        console.log(JSON.stringify({ ...route, route: schema.route + "/" + route.name }, null, 2));
        process.exit(0);
      }
    }
  }
}

console.error("Endpoint not found: " + endpoint);
process.exit(1);
