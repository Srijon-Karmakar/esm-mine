import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import {
  CreateMediaSignatureDto,
  CreateSocialCommentDto,
  CreateSocialPostDto,
  SocialFeedQueryDto,
} from './dto';
import { SocialService } from './social.service';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private social: SocialService) {}

  @Get('feed')
  feed(@Req() req: any, @Query() query: SocialFeedQueryDto) {
    return this.social.feed(req.user.sub, query);
  }

  @Post('media/signature')
  mediaSignature(@Body() dto: CreateMediaSignatureDto) {
    return this.social.createMediaSignature(dto);
  }

  @Post('posts')
  createPost(@Req() req: any, @Body() dto: CreateSocialPostDto) {
    return this.social.createPost(req.user.sub, dto);
  }

  @Post('posts/:postId/reactions/like')
  toggleLike(@Req() req: any, @Param('postId') postId: string) {
    return this.social.toggleLike(req.user.sub, postId);
  }

  @Post('posts/:postId/comments')
  createComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() dto: CreateSocialCommentDto,
  ) {
    return this.social.createComment(req.user.sub, postId, dto);
  }

  @Delete('comments/:commentId')
  deleteComment(@Req() req: any, @Param('commentId') commentId: string) {
    return this.social.deleteComment(req.user.sub, commentId);
  }
}
