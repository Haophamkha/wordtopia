import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { userId: number; email: string } => {
    return ctx.switchToHttp().getRequest().user;
  },
);