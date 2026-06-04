import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
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
 *
 * All endpoints are protected by JWT and operate in the context of
 * the currently authenticated user (req.user.sub).
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Returns a paginated list of notifications for the current user.
   */
  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'If true, only unread notifications are returned',
  })
  @ApiOkResponse({ description: 'Paginated notification list with unread count' })
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
  @ApiOperation({ summary: 'Get unread notification count (for badge)' })
  @ApiOkResponse({ description: 'Unread notification count', schema: { example: { count: 3 } } })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ObjectId' })
  @ApiNoContentResponse({ description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @Req() req: any) {
    await this.notificationsService.deleteNotification(id, req.user.sub);
    return { message: 'Notification deleted' };
  }
}
