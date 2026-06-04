import { Controller, Get, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SecurityService } from './security.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../common/constants/roles.enum';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get personal security dashboard' })
  async getDashboard(@Req() req: any) {
    return this.securityService.getDashboard(req.user.sub);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all active sessions' })
  async getSessions(@Req() req: any) {
    return this.securityService.getActiveSessions(req.user.sub);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate a specific session' })
  async terminateSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    await this.securityService.terminateSession(req.user.sub, sessionId);
    return { message: 'Session terminated successfully' };
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Terminate all sessions' })
  async terminateAllSessions(@Req() req: any) {
    await this.securityService.terminateAllSessions(req.user.sub);
    return { message: 'All sessions terminated' };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get security events for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getEvents(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.securityService.getSecurityEvents(req.user.sub, +page, +limit);
  }

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: platform security overview' })
  async getAdminOverview() {
    return this.securityService.getAdminSecurityOverview();
  }
}
