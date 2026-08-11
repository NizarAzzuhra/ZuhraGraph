import { User } from './User';

export class Buyer extends User {
  constructor(id: string, name: string, email: string, passwordHash: string) {
    super(id, name, email, passwordHash, 'BUYER');
  }

  public updateProfile(name: string, email: string): void {
    // Buyer can freely update profile
    this.name = name;
    this.email = email;
  }
}
