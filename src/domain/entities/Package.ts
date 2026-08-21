export class Package {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: number,
    public readonly status: 'ACTIVE' | 'INACTIVE',
    public readonly slot: number
  ) {
    if (!name || name.trim() === '') {
      throw new Error('Package name cannot be empty');
    }
    if (price < 0) {
      throw new Error('Package price cannot be negative');
    }
    if (slot < 1) {
      throw new Error('Package slot cannot be less than 1');
    }
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new Error('Package status must be ACTIVE or INACTIVE');
    }
  }
}
