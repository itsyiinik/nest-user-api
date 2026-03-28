import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox, OutboxStatus } from './outbox.entity';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_SERVICE } from '../transfer/transfer.tokens';
import { Cron } from '@nestjs/schedule';
import { lastValueFrom } from 'rxjs';
import CircuitBreaker from 'opossum';
import { CircuitBreakerService } from '../providers/circuit-breaker/circuit-breaker.service';

const MAX_RETRIES = 3;

@Injectable()
export class OutboxWorker implements OnModuleInit {
  private readonly logger = new Logger(OutboxWorker.name);
  private kafkaBreaker: CircuitBreaker<unknown[], unknown>;

  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  onModuleInit() {
    this.kafkaBreaker = this.circuitBreakerService.create(
      'kafka-outbox',
      (eventType: string, payload: unknown) =>
        lastValueFrom(this.kafkaClient.emit(eventType, payload)),
      {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 3,
      },
    );
  }

  @Cron('*/5 * * * * *')
  async processOutboxEvents() {
    if (this.kafkaBreaker.opened) {
      this.logger.warn(
        'Circuit [kafka-outbox] is OPEN — skipping outbox processing',
      );
      return;
    }

    const events = await this.outboxRepository.find({
      where: [
        { status: OutboxStatus.PENDING },
        { status: OutboxStatus.FAILED },
      ],
      order: { createdAt: 'ASC' },
      take: 10,
    });

    for (const event of events) {
      try {
        await this.kafkaBreaker.fire(event.eventType, event.payload);
        event.status = OutboxStatus.SENT;
        event.processedAt = new Date();
        this.logger.log(`Outbox event ${event.id} (${event.eventType}) sent`);
      } catch (err) {
        event.retryCount += 1;
        if (event.retryCount >= MAX_RETRIES) {
          event.status = OutboxStatus.DEAD_LETTER;
          this.logger.error(
            `Outbox event ${event.id} (${event.eventType}) moved to DEAD_LETTER after ${event.retryCount} retries`,
          );
        } else {
          event.status = OutboxStatus.FAILED;
          this.logger.warn(
            `Outbox event ${event.id} (${event.eventType}) failed (attempt ${event.retryCount}/${MAX_RETRIES}): ${(err as Error).message}`,
          );
        }
      }
      await this.outboxRepository.save(event);
    }
  }
}
