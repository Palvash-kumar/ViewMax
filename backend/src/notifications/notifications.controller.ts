import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * REST controller for the ViewMax Notification Center.
 */
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications/track-email/:logId/open
   * Tracks email open events anonymously using a transparent 1x1 tracking pixel.
   * Placed before generic routes to avoid shadow-matching issues.
   */
  @Get('track-email/:logId/open')
  @ApiOperation({ summary: 'Track email open event (anonymous)' })
  async trackEmailOpen(@Param('logId') logId: string, @Res() res: any) {
    const pixel = await this.notificationsService.trackEmailOpen(logId);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0',
    );
    return res.send(pixel);
  }

  /**
   * GET /notifications
   * Returns a paginated list of notifications for the current user.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'If true, only unread notifications are returned',
  })
  @ApiOkResponse({
    description: 'Paginated notification list with unread count',
  })
  async getNotifications(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findByUser(
      req.user.sub,
      page,
      Math.min(limit, 100), // cap at 100 per page
      unreadOnly === 'true',
    );
  }

  /**
   * GET /notifications/unread-count
   * Returns the badge count of unread notifications.
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count (for badge)' })
  @ApiOkResponse({
    description: 'Unread notification count',
    schema: { example: { count: 3 } },
  })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  /**
   * PATCH /notifications/read-all
   * Bulk-mark all of the user's notifications as read.
   * Must be placed BEFORE the :id route to avoid route shadowing.
   */
  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'Number of documents updated' })
  async markAllAsRead(@Req() req: any) {
    const result = await this.notificationsService.markAllAsRead(req.user.sub);
    return { message: 'All notifications marked as read', ...result };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ObjectId' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    await this.notificationsService.markAsRead(id, req.user.sub);
    return { message: 'Notification marked as read' };
  }

  /**
   * DELETE /notifications/:id
   * Remove a specific notification for the current user.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ObjectId' })
  @ApiNoContentResponse({ description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @Req() req: any) {
    await this.notificationsService.deleteNotification(id, req.user.sub);
    return { message: 'Notification deleted' };
  }
}
