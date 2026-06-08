import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
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
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const userId = req.user.sub || req.user._id.toString();
    return this.securityService.getDashboard(userId, { ipAddress, userAgent });
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all active sessions' })
  async getSessions(@Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const userId = req.user.sub || req.user._id.toString();
    const sid = req.user.sid;
    return this.securityService.getActiveSessions(userId, sid, { ipAddress, userAgent });
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Terminate a specific session' })
  async terminateSession(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
  ) {
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
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown User-Agent';
    const userId = req.user.sub || req.user._id.toString();
    return this.securityService.getSecurityEvents(userId, +page, +limit, { ipAddress, userAgent });
  }

  @Get('admin/overview')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: platform security overview' })
  async getAdminOverview() {
    return this.securityService.getAdminSecurityOverview();
  }
}
