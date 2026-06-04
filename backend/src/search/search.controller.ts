import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across movies, theatres, and users' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'type', required: false, enum: ['movies', 'theatres', 'users'] })
  @ApiQuery({ name: 'limit', required: false })
  async search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('limit') limit = 10,
  ) {
    return this.searchService.globalSearch(query, type, +limit);
  }
}
