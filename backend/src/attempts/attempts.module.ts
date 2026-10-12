import { Module } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { AttemptsController } from './attempts.controller';
import { ScoringService } from './scoring/scoring.service';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, ScoringService],
  exports: [AttemptsService, ScoringService],
})
export class AttemptsModule {}
