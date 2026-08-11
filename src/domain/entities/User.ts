export abstract class User {
  public readonly id: string;
  public name: string;
  public email: string;
  protected role: string;
  private passwordHash: string;

  constructor(
    id: string,
    name: string,
    email: string,
    passwordHash: string,
    role: string
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
  }

  public getRole(): string {
    return this.role;
  }

  public authenticate(password: string): boolean {
    // In a real scenario, this would use bcrypt.compare
    // We encapsulate the logic here.
    return true; // Simplified for OOP demonstration
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  // Polymorphic method
  public abstract updateProfile(name: string, email: string): void;
}
