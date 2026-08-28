import { CircuitState, CircuitBreakerStats } from './types';

export class CircuitBreaker {
  private name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastStateChange: number = Date.now();
  private failureThreshold: number;
  private cooldownMs: number;

  constructor(
    name: string,
    failureThreshold: number = parseInt(process.env.AI_CIRCUIT_FAILURE_THRESHOLD || '3', 10),
    cooldownMs: number = parseInt(process.env.AI_CIRCUIT_COOLDOWN_MS || '60000', 10)
  ) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
  }

  public isAvailable(): boolean {
    const now = Date.now();
    if (this.state === 'OPEN') {
      if (now - this.lastStateChange > this.cooldownMs) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = now;
        console.log(`[AI CircuitBreaker] provider=${this.name} transition=OPEN->HALF_OPEN message="Cooldown period expired. Allowing single trial request."`);
        return true;
      }
      return false;
    }
    return true; // CLOSED or HALF_OPEN
  }

  public recordSuccess(): void {
    if (this.state !== 'CLOSED') {
      console.log(`[AI CircuitBreaker] provider=${this.name} transition=${this.state}->CLOSED message="Trial request succeeded. Circuit restored to normal."`);
    }
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastStateChange = Date.now();
  }

  public recordFailure(shouldTripImmediately: boolean = false): void {
    this.failureCount++;
    const now = Date.now();

    if (shouldTripImmediately || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = now;
      console.warn(
        `[AI CircuitBreaker] provider=${this.name} status=TRIPPED state=OPEN failures=${this.failureCount} threshold=${this.failureThreshold} cooldownMs=${this.cooldownMs} immediateTrip=${shouldTripImmediately}`
      );
    }
  }

  public getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      lastStateChange: this.lastStateChange,
    };
  }

  public getName(): string {
    return this.name;
  }
}
