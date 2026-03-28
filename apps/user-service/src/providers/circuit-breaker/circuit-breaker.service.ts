import { Injectable, Logger } from '@nestjs/common';
import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  volumeThreshold?: number;
}

const DEFAULTS: CircuitBreakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly breakers = new Map<
    string,
    CircuitBreaker<unknown[], unknown>
  >();

  create<T>(
    name: string,
    fn: (...args: unknown[]) => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker<unknown[], T> {
    if (this.breakers.has(name)) {
      return this.breakers.get(name) as CircuitBreaker<unknown[], T>;
    }

    const breaker = new CircuitBreaker(fn, { ...DEFAULTS, ...options });

    breaker.on('open', () =>
      this.logger.warn(`Circuit [${name}] OPEN — stopping calls`),
    );
    breaker.on('halfOpen', () =>
      this.logger.log(`Circuit [${name}] HALF-OPEN — testing recovery`),
    );
    breaker.on('close', () =>
      this.logger.log(`Circuit [${name}] CLOSED — back to normal`),
    );
    breaker.on('fallback', () =>
      this.logger.warn(`Circuit [${name}] fallback triggered`),
    );
    breaker.on('timeout', () =>
      this.logger.warn(`Circuit [${name}] call timed out`),
    );

    this.breakers.set(name, breaker as CircuitBreaker<unknown[], unknown>);
    return breaker;
  }

  getState(name: string): string {
    const breaker = this.breakers.get(name);
    if (!breaker) return 'NOT_CREATED';
    if (breaker.opened) return 'OPEN';
    if (breaker.halfOpen) return 'HALF_OPEN';
    return 'CLOSED';
  }
}
