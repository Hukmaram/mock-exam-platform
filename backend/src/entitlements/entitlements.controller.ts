import { Controller, Get, Query } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get('my')
  async getMyEntitlements(@CurrentUser('userId') userId: string) {
    return this.entitlementsService.getUserEntitlements(userId);
  }

  @Get('check')
  async checkAccess(
    @CurrentUser('userId') userId: string,
    @Query('certificationId') certId?: string,
    @Query('examId') examId?: string,
  ) {
    const hasAccess = await this.entitlementsService.checkAccess(userId, certId, examId);
    return { hasAccess };
  }
}
