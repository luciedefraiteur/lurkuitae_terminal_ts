export class Memory {
  private static memoryLog: string[] = [];

  static getContext(): string {
    return this.memoryLog.join('\n');
  }

  static append(entry: string): void {
    if (this.memoryLog.length > 10) {
      this.memoryLog.shift();
    }
    this.memoryLog.push(entry);
  }
}
