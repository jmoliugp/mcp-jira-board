function greet(name: string): string {
  return `Hello, ${name}!`;
}

function main(): void {
  const message = greet('TypeScript');
  console.log(message);
}

if (require.main === module) {
  main();
}

export { greet };
