#!/usr/bin/env bun
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { authClient } from "@/lib/auth-client";

async function main() {
  const rl = readline.createInterface({ input, output });

  const email = await rl.question("Email: ");
  const password = await rl.question("Password: ");
  const firstName = await rl.question("First name: ");
  const lastName = await rl.question("Last name: ");

  rl.close();

  const { data, error } = await authClient.signUp.email({
    email,
    password,
    name: `${firstName} ${lastName}`,
  });

  if (error) {
    console.error("\n❌ Failed to create user:");
    console.error(error);
    process.exit(1);
  }

  console.log("\n✅ User created successfully!");
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}

main();