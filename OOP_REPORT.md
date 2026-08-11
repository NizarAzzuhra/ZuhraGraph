# ZuhraGraph OOP Report

This report outlines how Object-Oriented Programming (OOP) principles were applied in the ZuhraGraph backend, as required by the assignment guidelines.

## 1. Class
- **File:** `src/domain/entities/Order.ts`, `src/domain/entities/Payment.ts`
- **Class:** `Order`, `Payment`
- **Explanation:** Classes act as blueprints for business entities, encapsulating both data (state) and behavior (methods).

## 2. Object
- **File:** `src/application/services/OrderService.ts`
- **Object:** `const order = new Order(...)`
- **Explanation:** An object is instantiated in the `createOrder` method using the `new` keyword to represent a specific, real-world order.

## 3. Attribute / Property
- **File:** `src/domain/entities/Order.ts`
- **Properties:** `id`, `buyerId`, `status`, `totalAmount`
- **Explanation:** Variables bound to the class that hold the state of the `Order`.

## 4. Method
- **File:** `src/domain/entities/Order.ts`
- **Method:** `submit()`, `markAsPaid()`
- **Explanation:** Methods represent the behavior of an object. Here they strictly handle business rules, such as throwing errors if a status transition is invalid.

## 5. Encapsulation
- **File:** `src/domain/entities/User.ts`, `src/domain/entities/Order.ts`
- **Implementation:** `private passwordHash: string;`, `protected status: OrderStatus;`
- **Explanation:** Internal state variables are hidden (`private`/`protected`) from the outside. To read the status, you use `getStatus()`, and to modify it, you must use designated state transition methods like `submit()`.

## 6. Inheritance
- **File:** `src/domain/entities/Admin.ts`, `src/domain/entities/Buyer.ts`
- **Implementation:** `class Admin extends User`
- **Explanation:** Both `Admin` and `Buyer` inherit common attributes (`id`, `name`, `email`) and methods from the abstract parent class `User`, reducing code duplication.

## 7. Polymorphism
- **File:** `src/domain/entities/Admin.ts`, `src/domain/entities/Buyer.ts`
- **Implementation:** `public updateProfile(name: string, email: string)`
- **Explanation:** The `User` class defines an abstract method `updateProfile`. The `Admin` child class overrides it with strict rules (e.g., verifying a corporate email format), while the `Buyer` class implements it freely.

## 8. Abstraction
- **File:** `src/domain/interfaces/PaymentGateway.ts`
- **Implementation:** `interface PaymentGateway`
- **Explanation:** The interface defines *what* a payment gateway should do without caring *how* it does it. The business logic only knows about `PaymentGateway`, abstracting away external APIs.

## 9. Dependency Injection
- **File:** `src/application/services/OrderService.ts`
- **Implementation:** 
  ```typescript
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationService: NotificationService
  )
  ```
- **Explanation:** Dependencies are injected through the constructor rather than instantiated inside the service. This allows swapping real implementations with mocks for testing easily.

## 10. Repository Pattern
- **File:** `src/infrastructure/repositories/PrismaOrderRepository.ts`
- **Implementation:** `class PrismaOrderRepository implements OrderRepository`
- **Explanation:** Separates data access logic from business logic. The service calls `save()` or `findById()` without knowing it uses Prisma or PostgreSQL.

## 11. Service Layer
- **File:** `src/application/services/OrderService.ts`
- **Implementation:** `class OrderService`
- **Explanation:** Orchestrates business operations. It coordinates between creating the domain entity, persisting it via the repository, and triggering the payment gateway.
