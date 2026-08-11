import { User } from './User';

export class Admin extends User {
  constructor(id: string, name: string, email: string, passwordHash: string) {
    super(id, name, email, passwordHash, 'ADMIN');
  }

  public updateProfile(name: string, email: string): void {
    // Admin has specific rules, maybe can't change email without extra verification
    if (!email.includes('@zuhra.com')) {
      throw new Error('Admin email must be a corporate email.');
    }
    this.name = name;
    this.email = email;
  }

  public activatePackage(packageId: string): void {
    // specific admin behavior
  }
}
