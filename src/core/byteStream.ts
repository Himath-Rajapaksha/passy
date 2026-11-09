export class ByteStream {
  private position = 0;

  constructor(private readonly bytes: Uint8Array) {}

  nextByte(): number {
    if (this.position >= this.bytes.length) {
      throw new RangeError("Keystream exhausted");
    }
    return this.bytes[this.position++];
  }

  nextIndex(bound: number): number {
    if (!Number.isInteger(bound) || bound < 1 || bound > 256) {
      throw new RangeError("Bound must be an integer from 1 to 256");
    }
    const limit = 256 - (256 % bound);
    for (;;) {
      const value = this.nextByte();
      if (value < limit) return value % bound;
    }
  }

  remaining(): number {
    return this.bytes.length - this.position;
  }
}
